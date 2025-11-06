// @ts-nocheck
"use client";

import React, { useMemo } from "react";
import {
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  TimePicker,
  Switch,
  Checkbox,
  Radio,
  Slider,
  Rate,
  Upload,
  Button,
  Row,
  Col,
  Space,
  message,
} from "antd";
import { useSearchParams, useRouter } from "next/navigation";
import { InboxOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import styles from "./page.module.css";

const { RangePicker } = DatePicker;
const { Dragger } = Upload;

// -------------------- helpers: base64 <-> JSON --------------------
function safeAtob(str) { try { return atob(str); } catch { return ""; } }
function safeBtoa(str) { try { return btoa(str); } catch { return ""; } }
function decodeJsonParam(paramVal) {
  if (!paramVal) return null;
  const text = safeAtob(decodeURIComponent(paramVal));
  try { return JSON.parse(text); } catch { return null; }
}
function encodeJsonParam(obj) {
  const text = JSON.stringify(obj ?? {});
  return encodeURIComponent(safeBtoa(text));
}

// -------------------- dynamic-form helpers --------------------
function toDayjs(v, fmt) { if (!v) return undefined; return fmt ? dayjs(v, fmt) : dayjs(v); }
function shouldShow(values, f) {
  if (f.hidden) return false;
  if (!f.showIf) return true;
  const dep = values?.[f.showIf.field];
  const { equals, notEquals, in: inArr, notIn } = f.showIf;
  if (equals !== undefined && dep !== equals) return false;
  if (notEquals !== undefined && dep === notEquals) return false;
  if (Array.isArray(inArr) && !inArr.includes(dep)) return false;
  if (Array.isArray(notIn) && notIn.includes(dep)) return false;
  return true;
}
// (kept simple; if your JSON patterns include `-` inside classes, use the safer converter shown earlier)
function baseItemRules(f) {
  const rules = [];
  if (f.required) rules.push({ required: true, message: `${f.label || f.key} is required` });
  (f.rules || []).forEach((r) => {
    const rule = {};
    if (r.required) rule.required = true;
    if (typeof r.min === "number") rule.min = r.min;
    if (typeof r.max === "number") rule.max = r.max;
    if (r.pattern) rule.pattern = new RegExp(r.pattern);
    if (r.message) rule.message = r.message;
    rules.push(rule);
  });
  return rules;
}

// -------------------- component --------------------
export default function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const schema = decodeJsonParam(searchParams.get("schema")) || {
    title: "Dynamic Form",
    description: "",
    layout: { cols: 2, gutter: 16 },
    submitText: "Submit",
    resetText: "Reset",
    fields: [],
  };
  const initialExternal = decodeJsonParam(searchParams.get("initial")) || {};
  const returnUrl = searchParams.get("returnUrl") || "";
  const origin = searchParams.get("origin") || "*";
  const mode = (searchParams.get("mode") || "postMessage").toLowerCase();
  const formId = searchParams.get("formId") || "";

  const [form] = Form.useForm();

  const cols = schema.layout?.cols || 1;
  const gutter = schema.layout?.gutter || 16;

  // Merge initial values (schema defaults + external initial)
  const mergedInitials = useMemo(() => {
    const acc = {};
    for (const f of schema.fields || []) {
      if (f.defaultValue !== undefined) acc[f.key] = f.defaultValue;
    }
    return { ...acc, ...initialExternal };
  }, [schema, initialExternal]);

  // Normalize date/time initial values
  const normalizedInitials = useMemo(() => {
    const v = { ...mergedInitials };
    (schema.fields || []).forEach((f) => {
      const fv = mergedInitials[f.key];
      switch (f.type) {
        case "date":
        case "time":
        case "datetime":
          v[f.key] = toDayjs(fv, f.format);
          break;
        case "daterange":
        case "timerange":
          if (Array.isArray(fv)) v[f.key] = fv.map((x) => toDayjs(x, f.format));
          break;
        default:
          break;
      }
    });
    return v;
  }, [mergedInitials, schema]);

  const sendBack = (payload) => {
    const envelope = { type: "DYNAMIC_FORM_SUBMIT", formId, data: payload, ts: Date.now() };

    if (mode !== "redirect" && typeof window !== "undefined" && window.opener) {
      window.opener.postMessage(envelope, origin || "*");
      message.success("Submitted! You can close this tab.");
      try { window.close(); } catch {}
      return;
    }

    if (returnUrl) {
      const dataParam = encodeJsonParam(envelope);
      router.replace(`${returnUrl}?data=${dataParam}`);
      return;
    }

    message.success("Submitted! (No return target). Check console.");
    // eslint-disable-next-line no-console
    console.log("DYNAMIC_FORM_SUBMIT (no target):", envelope);
  };

  const handleFinish = (values) => {
    const cleaned = {};
    (schema.fields || []).forEach((f) => {
      const v = values[f.key];
      if (v == null) { cleaned[f.key] = v; return; }
      switch (f.type) {
        case "date":
        case "time":
        case "datetime":
          cleaned[f.key] = v?.toISOString?.() || v;
          break;
        case "daterange":
        case "timerange":
          cleaned[f.key] = Array.isArray(v)
            ? v.map((d) => (d?.toISOString ? d.toISOString() : d))
            : v;
          break;
        case "upload": {
          const files = v || [];
          cleaned[f.key] = files.map((file) => ({
            uid: file.uid, name: file.name, size: file.size, type: file.type, url: file.url, status: file.status,
          }));
          break;
        }
        case "checkbox":
          cleaned[f.key] = !!v; break;
        default:
          cleaned[f.key] = v;
      }
    });
    sendBack(cleaned);
  };

  const renderControl = (f) => {
    const common = { placeholder: f.placeholder, disabled: f.disabled };

    switch (f.type) {
      case "text":
      case "email":
      case "password": {
        const inputProps = { ...common, allowClear: true };
        if (f.type === "password") return <Input.Password {...inputProps} />;
        if (f.type === "email") return <Input type="email" {...inputProps} />;
        return <Input {...inputProps} />;
      }
      case "number":
        return <InputNumber {...common} style={{ width: "100%" }} min={f.min} max={f.max} step={f.step} precision={f.precision} />;
      case "textarea":
        return <Input.TextArea {...common} rows={f.rows || 4} allowClear />;
      case "select":
        return <Select {...common} options={f.options} showSearch mode={f.mode} optionFilterProp="label" />;
      case "multiselect":
        return <Select {...common} mode="multiple" options={f.options} showSearch optionFilterProp="label" />;
      case "radio":
        return <Radio.Group options={f.options} optionType="default" buttonStyle="solid" />;
      case "checkbox":
        return <Checkbox>{f.label}</Checkbox>;
      case "checkboxGroup":
        return <Checkbox.Group options={f.options} />;
      case "switch":
        return <Switch />;
      case "date":
        return <DatePicker style={{ width: "100%" }} showTime={f.showTime} format={f.format} />;
      case "time":
        return <TimePicker style={{ width: "100%" }} format={f.format || "HH:mm"} />;
      case "datetime":
        return <DatePicker style={{ width: "100%" }} showTime format={f.format || "YYYY-MM-DD HH:mm"} />;
      case "daterange":
        return <RangePicker style={{ width: "100%" }} format={f.format || "YYYY-MM-DD"} />;
      case "timerange":
        return <TimePicker.RangePicker style={{ width: "100%" }} format={f.format || "HH:mm"} />;
      case "slider":
        return <Slider min={f.min} max={f.max} step={f.step} />;
      case "rate":
        return <Rate count={f.max || 5} />;
      case "upload":
        return (
          <Dragger multiple beforeUpload={() => false} listType="text">
            <p className="ant-upload-drag-icon"><InboxOutlined /></p>
            <p className="ant-upload-text">Click or drag files to this area to upload</p>
            {f.placeholder ? <p className="ant-upload-hint">{f.placeholder}</p> : null}
          </Dragger>
        );
      default:
        return <Input {...common} />;
    }
  };

  return (
    <div className={styles.container}>
      {/* Header at left; description right below */}
      <h1 className={styles.title}>{schema.title || "Dynamic Form"}</h1>
      {schema.description ? <p className={styles.desc}>{schema.description}</p> : null}

      {/* Fields rendered directly (no Card) */}
      <Form
        form={form}
        layout="vertical"
        initialValues={normalizedInitials}
        onFinish={handleFinish}
      >
        <Row gutter={gutter}>
          {(schema.fields || []).map((f) => {
            const values = form.getFieldsValue(true);
            if (!shouldShow(values, f)) return null;

            const isSingleCheckbox = f.type === "checkbox";
            const colSpan = Math.min(24, Math.max(6, Math.round((f.span || 1) * (24 / (schema.layout?.cols || 1)))));

            return (
              <Col key={f.key} span={colSpan}>
                <Form.Item
                  name={f.key}
                  valuePropName={f.type === "switch" || f.type === "checkbox" ? "checked" : "value"}
                  label={isSingleCheckbox ? undefined : f.label}
                  tooltip={f.tooltip}
                  rules={isSingleCheckbox ? [] : baseItemRules(f)}
                >
                  {renderControl(f)}
                </Form.Item>
              </Col>
            );
          })}
        </Row>

        <Space className={styles.actions}>
          <Button onClick={() => form.resetFields()}>{schema.resetText || "Reset"}</Button>
          <Button type="primary" htmlType="submit">
            {schema.submitText || "Submit"}
          </Button>
        </Space>
      </Form>
    </div>
  );
}
