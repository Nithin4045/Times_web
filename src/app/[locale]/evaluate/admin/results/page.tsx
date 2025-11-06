"use client";

import { useEffect, useMemo, useState } from "react";
import { Select, Button, Table, message, Space, Input } from "antd";
import type { ColumnsType } from "antd/es/table";
import * as XLSX from "xlsx";
import styles from "./results.module.css";
import "@/app/global.css";
import axios from "axios";
import { DownOutlined, SearchOutlined, UpOutlined } from "@ant-design/icons";
import { useSession } from "next-auth/react";

const { Option } = Select;

type TestsByBatch = {
  [batchCode: string]: { TEST_ID: number; TEST_DESCRIPTION: string }[];
};

type TestRow = { [key: string]: string | number | null };

type TestSummaryRow = {
  subject: string;
  totalQuestions: number;
  totalScore: number;
  Time: number;
  topicNames: string[];
};

export default function TestResultsPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;

  const [batches, setBatches] = useState<string[]>([]);
  const [testsByBatch, setTestsByBatch] = useState<TestsByBatch>({});
  const [selectedBatch, setSelectedBatch] = useState<string[]>([]);
  const [filteredTests, setFilteredTests] = useState<{ TEST_ID: number; TEST_DESCRIPTION: string }[]>([]);
  const [selectedTest, setSelectedTest] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [gridLoading, setGridLoading] = useState(false);

  const [resultsData, setResultsData] = useState<TestRow[]>([]);
  const [columns, setColumns] = useState<ColumnsType<TestRow>>([]);

  const [summary, setSummary] = useState<{ totalQuestions: number; totalScore: number } | null>(null);
  const [details, setDetails] = useState<TestSummaryRow[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    if (!role) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const resp = await fetch(`/api/evaluate/Admin/results?role=${encodeURIComponent(role)}`);
        const json = await resp.json();
        console.log("[GET /Admin/results] payload:", json);

        if (!resp.ok) {
          message.error(json?.message || "Failed to fetch batch and test data");
          setBatches([]);
          setTestsByBatch({});
          return;
        }

        const batchKeys = Object.keys(json || {});
        if (batchKeys.length === 0) {
          message.info("No test data available for your role.");
          setBatches([]);
          setTestsByBatch({});
          return;
        }

        setBatches(batchKeys);
        setTestsByBatch(json as TestsByBatch);

        // NEW: auto-select the first batch & its first test → this will trigger auto-fetch of TEST DETAILS below
        const firstBatch = batchKeys[0];
        const testsForFirst = ((json as TestsByBatch)[firstBatch] || []).filter(Boolean);
        setSelectedBatch([firstBatch]);
        setFilteredTests(testsForFirst);
        setSelectedTest(testsForFirst[0]?.TEST_ID ?? null);
      } catch (e) {
        console.error("[GET /Admin/results] error:", e);
        message.error("Error fetching batch and test data");
        setBatches([]);
        setTestsByBatch({});
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [role]);

  const handleBatchChange = (value: string[]) => {
    setSelectedBatch(value);
    setSelectedTest(null);

    const seen = new Map<number, { TEST_ID: number; TEST_DESCRIPTION: string }>();
    value.forEach((batch) => {
      const batchTests = testsByBatch[batch] || [];
      batchTests.forEach((t) => {
        if (t && typeof t.TEST_ID === "number" && !seen.has(t.TEST_ID)) seen.set(t.TEST_ID, t);
      });
    });

    const merged = Array.from(seen.values());
    setFilteredTests(merged);
    console.log("[handleBatchChange] selected:", value, "merged tests:", merged);

    if (value.length > 0 && merged.length === 0) {
      message.info("No tests found for the selected batch(es).");
    }

    // NEW: auto-pick first test when user changes batches
    if (merged.length > 0) setSelectedTest(merged[0].TEST_ID);
  };

  // NEW: whenever selectedTest changes, auto-fetch TEST DETAILS (so user doesn’t need to click Generate)
  useEffect(() => {
    if (!selectedTest) return;
    fetchTestDetails(selectedTest);
  }, [selectedTest]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchTestDetails = async (testId: number) => {
    try {
      const resp = await axios.get(`/api/evaluate/instructions?testId=${testId}`);
      console.log("[GET /instructions] payload:", resp.data);
      const { summary, details } = resp.data || {};
      setSummary(summary || null);
      setDetails(Array.isArray(details) ? details : []);
    } catch (e) {
      console.error("[GET /instructions] error:", e);
      // Be gentle: show empty table if api returns 404/500
      setSummary({ totalQuestions: 0, totalScore: 0 });
      setDetails([]);
    }
  };

  const handleGenerateResults = async () => {
    if (selectedBatch.length === 0 || !selectedTest) {
      message.error("Please select batches and a test");
      return;
    }

    setGridLoading(true);
    try {
      const resp = await fetch("/api/evaluate/Admin/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test_id: selectedTest, batch_codes: selectedBatch }),
      });

      const json = await resp.json();
      console.log("[POST /Admin/results] payload:", json);

      if (!resp.ok) {
        message.error(json?.message || "Failed to generate results");
        setResultsData([]);
        setColumns([]);
        return;
      }

      const rows: TestRow[] = Array.isArray(json?.data) ? json.data : [];
      processResults(rows);
      message.success("Results generated successfully for all selected batches");

      // (Optional) We still call details here, but it's already auto-called via the useEffect above.
      // await fetchTestDetails(selectedTest);
    } catch (e) {
      console.error("[POST /Admin/results] error:", e);
      message.error("Error generating results");
    } finally {
      setGridLoading(false);
    }
  };

  const processResults = (rows: TestRow[]) => {
    if (!rows.length) {
      setResultsData([]);
      setColumns([]);
      return;
    }

    const allKeys = Array.from(
      rows.reduce<Set<string>>((acc, r) => {
        Object.keys(r || {}).forEach((k) => acc.add(k));
        return acc;
      }, new Set<string>())
    );

    const dynamicCols: ColumnsType<TestRow> = allKeys.map((key) => ({
      title: key,
      dataIndex: key,
      key,
      sorter: (a, b) => {
        const av = a?.[key] ?? "";
        const bv = b?.[key] ?? "";
        const an = Number(av);
        const bn = Number(bv);
        if (!Number.isNaN(an) && !Number.isNaN(bn)) return an - bn;
        return String(av).localeCompare(String(bv));
      },
      render: (val) => (val ?? "0") as any,
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder={`Search ${key}`}
            value={selectedKeys?.[0]}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ width: 188, marginBottom: 8, display: "block" }}
          />
          <Space>
            <Button type="link" onClick={() => clearFilters && clearFilters()}>
              Reset
            </Button>
            <Button type="primary" onClick={() => confirm()} icon={<SearchOutlined />}>
              Search
            </Button>
          </Space>
        </div>
      ),
      filterIcon: (filtered: boolean) => (
        <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
      ),
      onFilter: (value, record) => {
        const recordValue = record?.[key] ?? "";
        return String(recordValue).toLowerCase().includes(String(value).toLowerCase());
      },
    }));

    setResultsData(rows);
    setColumns(dynamicCols);
  };

  const handleDownloadResults = () => {
    if (!resultsData.length) {
      message.warning("No data available to download.");
      return;
    }

    const formatted = resultsData.map((row) => {
      const out: Record<string, any> = {};
      Object.keys(row).forEach((k) => {
        const v = row[k];
        out[k.toUpperCase()] = v === null ? 0 : v;
      });
      return out;
    });

    const sheet = XLSX.utils.json_to_sheet(formatted);
    const keys = Object.keys(formatted[0] || {});
    const range = XLSX.utils.decode_range(sheet["!ref"] || "A1");
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cell = XLSX.utils.encode_col(C) + "1";
      if (sheet[cell]) sheet[cell].v = keys[C];
    }

    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "Test Results");
    XLSX.writeFile(book, `Test_Results_${selectedBatch.join("-")}_${selectedTest}.xlsx`);
  };

  const testSummaryColumns: ColumnsType<TestSummaryRow> = useMemo(
    () => [
      { title: "Subject", dataIndex: "subject", key: "subject" },
      { title: "Total Questions", dataIndex: "totalQuestions", key: "totalQuestions" },
      { title: "Total Marks", dataIndex: "totalScore", key: "totalScore" },
      { title: "Time", dataIndex: "Time", key: "Time" },
      {
        title: "Topics",
        dataIndex: "topicNames",
        key: "topicNames",
        render: (v: string[] | undefined) => (v || []).join(", "),
      },
    ],
    []
  );

  return (
    <div style={{ padding: 20 }}>
      <div className="MainTitle">TEST RESULTS</div>

      <div className={styles.gridContainer} style={{ marginTop: 15 }}>
        <div>
          <label className={styles.label}>Select Batch</label>
          <Select
            placeholder="Select Batch"
            className={styles.fullWidth}
            mode="multiple"
            maxTagCount="responsive"
            value={selectedBatch}
            onChange={handleBatchChange}
            loading={loading}
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) =>
              String(option?.children ?? "").toLowerCase().includes(input.toLowerCase())
            }
          >
            {batches.map((batch) => (
              <Option key={batch} value={batch}>
                {batch}
              </Option>
            ))}
          </Select>
        </div>

        <div>
          <label className={styles.label}>Select Test</label>
          <Select
            placeholder="Select Test"
            className={styles.fullWidth}
            value={selectedTest ?? undefined}
            onChange={(v: number) => setSelectedTest(v)}
            disabled={selectedBatch.length === 0}
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) =>
              String(option?.children ?? "").toLowerCase().includes(input.toLowerCase())
            }
          >
            {filteredTests.map((t) => (
              <Option key={t.TEST_ID} value={t.TEST_ID}>
                {t.TEST_DESCRIPTION}
              </Option>
            ))}
          </Select>
        </div>

        <div className="generatebuttondiv">
          <Button className="generatebutton" onClick={handleGenerateResults} loading={gridLoading}>
            Generate Results
          </Button>
          {resultsData.length > 0 && (
            <Button className="generatebutton" type="primary" onClick={handleDownloadResults}>
              Download Results
            </Button>
          )}
        </div>
      </div>

      <div className={styles.secondheader}>
        TEST DETAILS
        <Button
          type="text"
          onClick={() => setIsExpanded((v) => !v)}
          icon={isExpanded ? <UpOutlined /> : <DownOutlined />}
          style={{ marginLeft: 8 }}
        />
      </div>

      {isExpanded && (
        <div className="Table-One-Div-Appli">
          <Table<TestSummaryRow>
            columns={testSummaryColumns}
            dataSource={details}
            pagination={false}
            bordered
            className={styles.customtable}
            rowKey={(row, idx) => `${row.subject}-${idx}`}
          />
        </div>
      )}

      <div className={styles.secondheader}>TEST RESULTS</div>
      <div style={{ marginTop: 15, overflow: "auto" }}>
        <Table<TestRow>
          columns={columns}
          dataSource={resultsData}
          bordered
          loading={gridLoading}
          scroll={{ x: "max-content" }}
          rowKey={(row, idx) => String((row && (row["User Email"] as string)) || idx)}
          components={{
            header: {
              cell: (props: any) => (
                <th {...props} style={{ backgroundColor: "#7700CC", color: "white", fontWeight: "bold" }} />
              ),
            },
          }}
        />
      </div>
    </div>
  );
}
