"use client";
import {
  DeleteOutlined,
  EyeOutlined,
  PlusOutlined,
  UsergroupAddOutlined,
  EditOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import React, { useState, useEffect, useMemo } from "react";
import {
  Table,
  Space,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  message,
  Flex,
  Tooltip,
} from "antd";
import type { ColumnType } from "antd/es/table";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import useTestStore from "@/store/evaluate/teststore";
import ManageTestRepositoryDetails from "@/components/evaluate/ManageTestRepositoryDetails/ManageTestRepositoryDetails";
import "@/app/global.css";

dayjs.extend(utc);

interface TestData {
  status: number | string | null | undefined;
  TEST_ID: number;
  TEST_TYPE: string;
  TEST_DESCRIPTION: string;
  VALIDITY_START: string | null;
  VALIDITY_END: string | null;
  QUESTION_SELECTION_METHOD: string;
  GENERAL_DATA: string;
  LINK_TEST_DESCRIPTION: string;
  video?: number | null;
}

interface Batch {
  BATCH_CODE?: string;
  BATCH_NAME?: string | null;
}

/** Assigned row used in the Assign modal table (normalized) */
interface AssignedRow {
  TEST_ID: number;
  BATCH_CODES: string;
  BATCH_NAME?: string | null;
  uid?: string;
}

const AddTestDetails: React.FC = () => {
  const { data: session, status } = useSession();
  const isAuthReady = status === "authenticated" && !!session?.user?.id;
  const router = useRouter();
  const setTestId = useTestStore((state) => state.setTestId);
  const setUserTestId = useTestStore((s) => s.setUserTestId);

  const [repo, setRepo] = useState<TestData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Assign Users modal
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignTestId, setAssignTestId] = useState<number | null>(null);
  const [assignTable, setAssignTable] = useState<AssignedRow[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [assignForm] = Form.useForm();

  // ➕ Test Details modal
  const [openTestModal, setOpenTestModal] = useState(false);
  const [addTestModalTestId, setAddTestModalTestId] = useState<number | null>(null);

  // column search state
  const [searchText, setSearchText] = useState<string>("");
  const [searchedColumn, setSearchedColumn] = useState<string>("");

  const [previewLoadingId, setPreviewLoadingId] = useState<number | null>(null);

  const fetchBatchCodes = async (TEST_ID: any) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/evaluate/Admin/batch-codes?TEST_ID=${TEST_ID}`);
      // kept for backward compat — not used by new flow but left for debugging
      // setTableData(response.data);
      console.log("fetchBatchCodes (legacy) ->", response.data);
    } catch (error) {
      console.error("Failed to fetch items:", error);
    } finally {
      setLoading(false);
    }
  };

  /** ====== Data ====== */
  const fetchRepository = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/evaluate/repository`);
      const raw: any[] = Array.isArray(response.data) ? response.data : [];
      const normalized: TestData[] = raw.map((r) => ({
        status: r?.status ?? 0,
        TEST_ID: r?.test_id,
        TEST_TYPE: r?.test_type ?? "",
        TEST_DESCRIPTION: r?.test_description ?? "",
        VALIDITY_START: r?.validity_start ?? null,
        VALIDITY_END: r?.validity_end ?? null,
        QUESTION_SELECTION_METHOD: r?.question_selection_method ?? "",
        GENERAL_DATA: r?.general_data ?? "",
        LINK_TEST_DESCRIPTION: r?.test_title ?? "",
        video: r?.video ?? 0,
      }));
      console.log("✅ Normalized repository data:", normalized);
      setRepo(normalized);
    } catch (err) {
      console.error("Failed to fetch repository:", err);
      message.error("Unable to load test repository.");
    } finally {
      setLoading(false);
    }
  };

  const fetchBatchesForUser = async () => {
    if (!session?.user?.id || !session?.user?.role) return;
    try {
      const res = await axios.get(
        `/api/evaluate/Admin/evalbatches?USER_ID=${session.user.id}&ROLE=${session.user.role}`
      );
      console.log("🔹 Raw batches response:", res.data);

      // Support both shapes: res.data.batches OR res.data[1] etc.
      const arr = res?.data?.batches ?? res?.data?.[1] ?? res?.data ?? [];
      // Normalize to array of objects that match Batch interface
      const normalizedBatches: Batch[] = Array.isArray(arr) ? arr.map((b: any) => ({
        BATCH_CODE: b?.BATCH_CODE ?? b?.batch_code ?? String(b?.batchCode ?? ""),
        BATCH_NAME: b?.BATCH_NAME ?? b?.batch_name ?? b?.BATCH_DESCRIPTION ?? null,
      })) : [];
      console.log("✅ Extracted batches:", normalizedBatches);
      setBatches(normalizedBatches);
    } catch (err) {
      console.error("Failed to load batches:", err);
      setBatches([]);
      message.error("Unable to load batches.");
    }
  };

  const fetchAssignedBatchCodes = async (TEST_ID: number) => {
    try {
      const res = await axios.get(`/api/evaluate/Admin/batch-codes?TEST_ID=${TEST_ID}`);
      console.log(`🔹 Raw assigned batch codes for TEST_ID ${TEST_ID}:`, res.data);

      const rows: any[] = Array.isArray(res.data) ? res.data : [];

      const safeRows: AssignedRow[] = rows.map((r, idx) => {
        // server returns e.g. { batch_codes: 'SVECJ1', test_id: 4 } or uppercase names
        const batchCode = r?.BATCH_CODES ?? r?.batch_codes ?? r?.BATCH_CODE ?? r?.batch_code ?? "";
        const testId = Number(r?.TEST_ID ?? r?.test_id ?? TEST_ID);

        // attempt to find the name for this code from 'batches' state (BATCH_NAME is the correct property)
        const matched = batches.find((b) => String(b.BATCH_CODE) === String(batchCode));
        const batchName = matched?.BATCH_NAME ?? null;

        return {
          TEST_ID: testId,
          BATCH_CODES: String(batchCode),
          BATCH_NAME: batchName,
          uid: `${testId}-${String(batchCode) || "__EMPTY__"}-${idx}`,
        } as AssignedRow;
      });

      // Deduplicate by composite key (TEST_ID + BATCH_CODES)
      const unique = Array.from(
        new Map(safeRows.map((r) => [`${r.TEST_ID}-${r.BATCH_CODES}`, r])).values()
      );

      console.log("fetchAssignedBatchCodes -> raw rows:", rows);
      console.log("fetchAssignedBatchCodes -> normalized unique:", unique);

      setAssignTable(unique);
    } catch (err) {
      console.error("Failed to fetch assigned batch codes:", err);
      setAssignTable([]);
      message.error("Failed to load assigned batches.");
    }
  };

  useEffect(() => {
    fetchRepository();
  }, []);

  useEffect(() => {
    fetchBatchesForUser();
  }, [session?.user?.id, session?.user?.role]);

  useEffect(() => {
    console.log("Session object:", session);
    console.log("Auth status:", status);
  }, [session, status]);

  

  /** ====== Column helper ====== */
  const getSearchable = (dataIndex: keyof TestData): ColumnType<TestData> => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => {
      const val = Array.isArray(selectedKeys) ? (selectedKeys[0] as string) : "";
      return (
        <div style={{ padding: 8 }}>
          <Input
            placeholder={`Search ${String(dataIndex)}`}
            value={val}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => {
              confirm();
              setSearchText(val || "");
              setSearchedColumn(String(dataIndex));
            }}
            style={{ marginBottom: 8, display: "block" }}
          />
          <Space>
            <Button
              type="primary"
              onClick={() => {
                confirm();
                setSearchText(val || "");
                setSearchedColumn(String(dataIndex));
              }}
              icon={<SearchOutlined />}
              size="small"
              style={{ width: 90 }}
            >
              Search
            </Button>
            <Button
              onClick={() => {
                clearFilters?.();
                setSearchText("");
                setSearchedColumn("");
                confirm();
              }}
              size="small"
              style={{ width: 90 }}
            >
              Reset
            </Button>
          </Space>
        </div>
      );
    },
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
    ),
    onFilter: (value, record) =>
      String(record[dataIndex] ?? "")
        .toLowerCase()
        .includes(String(value ?? "").toLowerCase()),
    sorter: (a, b) =>
      String(a[dataIndex] ?? "").localeCompare(String(b[dataIndex] ?? "")),
    render: (text: any) =>
      searchedColumn === String(dataIndex) ? <span>{text}</span> : text,
  });

  const handlePreviewTest = async (record: TestData) => {
    const tid = record?.TEST_ID;
    if (tid == null) {
      message.error("Missing TEST_ID for this row.");
      return;
    }

    const userId = session?.user?.id;
    if (!userId) {
      console.error("Session missing user id at preview click. session:", session);
      message.error("You are not signed in yet. Please wait a moment and try again.");
      return;
    }

    setPreviewLoadingId(tid);
    try {
      const resp = await axios.post('/api/evaluate/createUserTest', {
        test_id: Number(tid),
        user_id: Number(userId),
      });

      if (!resp || (resp.status && resp.status >= 400)) {
        console.error("createUserTest returned bad status:", resp?.status, resp);
        throw new Error("Server error creating user test");
      }

      const userTestId = resp?.data?.user_test_id ?? resp?.data?.userTestId ?? resp?.data?.id;
      if (!userTestId) {
        console.error("createUserTest missing user_test_id, resp.data:", resp?.data);
        throw new Error('No user_test_id returned from server');
      }

      try {
        setTestId(String(tid));
        setUserTestId(String(userTestId));
      } catch (err) {
        console.warn("store setters failed:", err);
      }

      await router.push(`/evaluate/instructions?testid=${encodeURIComponent(tid)}&userTestId=${encodeURIComponent(userTestId)}`);
    } catch (err: any) {
      console.error('Failed to create user_test or navigate:', err);
      const msg = err?.response?.data?.message ?? err?.message ?? 'Unable to initialize test for preview.';
      message.error(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setPreviewLoadingId(null);
    }
  };

//   const handleEditTest = (record: TestData) => {
//   // ✅ Open modal instead of navigating
//   setAddTestModalTestId(record.TEST_ID);
//   setOpenTestModal(true);
// };


  const handleEditTest = (record: TestData) => {
    const tid = record?.TEST_ID;
    if (!tid && tid !== 0) return;
    // router.push(`/evaluate/admin/addTest?TEST_ID=${tid}`);
    router.push(`/evaluate/admin/addTest?TEST_ID=${encodeURIComponent(tid)}`);
  };

  const handleTestAdd = (record: TestData) => {
    if (typeof record?.TEST_ID === "number") {
      setAddTestModalTestId(record.TEST_ID);
      setOpenTestModal(true);
    } else {
      message.error("Invalid TEST_ID for this row.");
    }
  };

  const handleToggleActive = async (record: TestData, on: boolean) => {
    try {
      const res = await axios.patch(
        `/api/evaluate/get_repository?TEST_ID=${record.TEST_ID}`,
        { status: on ? 1 : 0 }
      );
      if (res?.data?.success) {
        setRepo((prev) =>
          prev.map((r) =>
            r.TEST_ID === record.TEST_ID ? { ...r, status: on ? 1 : 0 } : r
          )
        );
        message.success(`Test ${on ? "activated" : "deactivated"}.`);
      } else {
        throw new Error("Update failed");
      }
    } catch (err) {
      console.error("Failed to update test repository", err);
      message.error("Failed to update status.");
    }
  };

  const openAssignModal = async (testId: number) => {
    console.log("📂 Opening assign modal for TEST_ID:", testId);
    setAssignTestId(testId);
    setAssignOpen(true);
    assignForm.resetFields();

    // ensure batches are present; if not, fetch them first
    if (!batches || batches.length === 0) {
      await fetchBatchesForUser();
    }
    await fetchAssignedBatchCodes(testId);
  };

  const handleDeleteAssigned = async (row: AssignedRow) => {
    console.log("🗑️ Deleting assigned batch row:", row);

    if (!row || !row.TEST_ID) {
      message.error("Invalid row selected for deletion.");
      return;
    }
    if (!row.BATCH_CODES || String(row.BATCH_CODES).trim() === "") {
      message.error("Batch code is empty — cannot delete.");
      return;
    }

    try {
      setLoading(true);
      console.log(row.TEST_ID, row.BATCH_CODES);
      const encodedTestId = encodeURIComponent(String(row.TEST_ID));
      const encodedBatch = encodeURIComponent(String(row.BATCH_CODES));
      console.log('Encoded:', encodedTestId, encodedBatch);
      const res = await axios.delete(
        // `/api/evaluate/Admin/batch-codes?TEST_ID=${encodedTestId}&BATCH_CODE=${encodedBatch}`
        `/api/codecompiler/batch-codes?TEST_ID=${encodedTestId}&BATCH_CODE=${encodedBatch}`
      );

      if (res.status === 200) {
        message.success("Removed batch assignment.");
        await fetchAssignedBatchCodes(row.TEST_ID);
      } else if (res.status === 404) {
        message.warning("Assignment not found, nothing to delete.");
        await fetchAssignedBatchCodes(row.TEST_ID);
      } else {
        message.error("Failed to remove assignment.");
        console.error("Delete returned non-200:", res.status, res.data);
      }
    } catch (err: any) {
      console.error("Delete assignment error:", err, err?.response?.data ?? "");
      const serverMsg = err?.response?.data?.message ?? err?.message ?? "Delete failed.";
      message.error(Array.isArray(serverMsg) ? serverMsg.join(", ") : serverMsg);
    } finally {
      setLoading(false);
    }
  };

  const submitAssign = async (values: { options: string[] }) => {
    if (!assignTestId) {
      message.error("No TEST_ID selected.");
      return;
    }
    const payload = {
      ...values,
      test_id: assignTestId,
      CreatedBy: session?.user?.id,
    };
    try {
      await axios.post("/api/evaluate/Admin/assign-users", payload);
      message.success("Test assigned successfully.");
      setAssignOpen(false);
      fetchAssignedBatchCodes(assignTestId);
    } catch (err) {
      console.error("Assign API Error:", err);
      message.error("Failed to assign test.");
    }
  };

  /** ====== Columns ====== */
  const columns: ColumnType<TestData>[] = useMemo(
    () => [
      {
        title: "Actions",
        key: "actions",
        render: (_: any, record: TestData) => (
          <Space size="middle">
            <Tooltip title={!isAuthReady ? (status === "loading" ? "Signing in — please wait" : "Please sign in to preview") : "Preview Test"}>
              <Button
                type="link"
                icon={<EyeOutlined />}
                onClick={() => handlePreviewTest(record)}
                loading={previewLoadingId === record.TEST_ID}
                disabled={!isAuthReady || (previewLoadingId !== null && previewLoadingId !== record.TEST_ID)}
              />
            </Tooltip>

            <Tooltip title="Edit Test">
              <Button type="link" icon={<EditOutlined />} onClick={() => handleEditTest(record)} />
            </Tooltip>
            <Tooltip title="Add Test Details">
              <Button type="link" icon={<PlusOutlined />} onClick={() => handleTestAdd(record)} />
            </Tooltip>
            <Tooltip title="Assign Users">
              <Button type="link" icon={<UsergroupAddOutlined />} onClick={() => openAssignModal(record.TEST_ID)} />
            </Tooltip>
            <Tooltip title={record.status === 1 || record.status === "1" ? "Click to deactivate" : "Click to activate"}>
              <Switch
                checked={record.status === 1 || record.status === "1"}
                onChange={(checked) => handleToggleActive(record, checked)}
                checkedChildren="Active"
                unCheckedChildren="Inactive"
              />
            </Tooltip>
          </Space>
        ),
      },
      { title: "Test Type", dataIndex: "TEST_TYPE", key: "TEST_TYPE", ...getSearchable("TEST_TYPE") },
      { title: "Description", dataIndex: "TEST_DESCRIPTION", key: "TEST_DESCRIPTION", ...getSearchable("TEST_DESCRIPTION") },
      {
        title: "Validity Start",
        dataIndex: "VALIDITY_START",
        key: "VALIDITY_START",
        sorter: (a, b) => new Date(a.VALIDITY_START || 0).getTime() - new Date(b.VALIDITY_START || 0).getTime(),
        render: (text: any) => (text ? dayjs.utc(text).format("DD-MM-YYYY hh:mm A") : "-"),
      },
      {
        title: "Validity End",
        dataIndex: "VALIDITY_END",
        key: "VALIDITY_END",
        sorter: (a, b) => new Date(a.VALIDITY_END || 0).getTime() - new Date(b.VALIDITY_END || 0).getTime(),
        render: (text: any) => (text ? dayjs.utc(text).format("DD-MM-YYYY hh:mm A") : "-"),
      },
      { title: "Question Method", dataIndex: "QUESTION_SELECTION_METHOD", key: "QUESTION_SELECTION_METHOD", ...getSearchable("QUESTION_SELECTION_METHOD") },
      {
        title: "Video",
        dataIndex: "video",
        key: "video",
        filters: [
          { text: "Yes", value: 1 },
          { text: "No", value: 0 },
        ],
        onFilter: (value, record) => Number(record.video ?? 0) === Number(value),
        sorter: (a, b) => Number(a.video ?? 0) - Number(b.video ?? 0),
        render: (value?: number | null) => (Number(value) === 1 ? "Yes" : "No"),
      },
      { title: "Link", dataIndex: "LINK_TEST_DESCRIPTION", key: "LINK_TEST_DESCRIPTION", ...getSearchable("LINK_TEST_DESCRIPTION") },
    ],
    [searchText, searchedColumn, repo, isAuthReady, previewLoadingId, status]
  );

  const assignedColumns = useMemo(
    () => [
      {
        title: "Test assigned Batches",
        dataIndex: "BATCH_CODES",
        key: "BATCH_CODES",
        render: (_: any, record: AssignedRow) => {
          const name = record?.BATCH_NAME;
          return name ? `${name} (${record.BATCH_CODES})` : record.BATCH_CODES || "-";
        },
      },
      {
        title: "Actions",
        key: "actions",
        render: (_: any, record: AssignedRow) => (
          <Tooltip title="Delete assignment">
            <Button
              icon={<DeleteOutlined />}
              type="link"
              onClick={() => handleDeleteAssigned(record)}
            />
          </Tooltip>
        ),
      },
    ],
    []
  );

  /** ====== Render ====== */
  return (
    <div style={{ padding: 20 }}>
      <Flex justify="space-between" align="center">
        <div>
          <span className="MainTitle">MANAGE TEST REPOSITORY</span>
        </div>
        <Button className="contentaddbutton1" onClick={() => router.push(`/evaluate/admin/addTest`)}>
          Add Test
        </Button>
      </Flex>

      <div className="Table-One-Div-Appli">
        <Table<TestData>
          className="CC_Table"
          id="users-table"
          columns={columns}
          dataSource={Array.isArray(repo) ? repo : []}
          rowKey={(r) => String(r.TEST_ID)}
          loading={loading}
        />
      </div>

      {/* ➕ Add Test Details Modal (only render when we have a definite number) */}
      {openTestModal && addTestModalTestId !== null && (
        <ManageTestRepositoryDetails
          open={openTestModal}
          onClose={() => {
            setOpenTestModal(false);
          }}
          test_id={addTestModalTestId}
        />
      )}

      {/* Assign Users Modal (AntD v5: use destroyOnHidden) */}
      <Modal
        title="Assign Users"
        open={assignOpen}
        onCancel={() => setAssignOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Table<AssignedRow>
          size="small"
          style={{ marginBottom: 16 }}
          columns={assignedColumns as any}
          dataSource={Array.isArray(assignTable) ? assignTable : []}
          rowKey={(record, index) => {
            const uid = (record as any).uid;
            if (typeof uid === "string" && uid.length) return uid;
            return `${record.TEST_ID}-${record.BATCH_CODES ?? "__EMPTY__"}-${index}`;
          }}
          pagination={false}
        />

        <Form form={assignForm} name="assignUsersForm" layout="vertical" onFinish={submitAssign}>
          <Form.Item
            label="Batch Code & Batch Name"
            name="options"
            rules={[{ required: true, message: "Please select at least one option!" }]}
          >
            <Select
              mode="multiple"
              placeholder="Select multiple batches"
              allowClear
              options={batches
                .filter((b) => !!b.BATCH_CODE)
                .map((b) => ({
                  value: String(b.BATCH_CODE),
                  label: `${b.BATCH_NAME ?? ""} (${b.BATCH_CODE})`,
                }))}
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Assign Test
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AddTestDetails;