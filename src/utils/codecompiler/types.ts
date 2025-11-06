import { ColumnType, ColumnGroupType } from "antd/es/table";
export type SubmissionType = "submissions" | "test";
export type User = {
  TEST_ID: number;
  USER_ID: number;
  USER_NAME: string;
  PASSWORD: string;
  ROLE: string;
  FIRST_NAME: string;
  STATUS: number;
};

export type MenuItem = {
  category: string;
  label: string;
  icon: string;
  link: string;
  children?: any[];
};

export type FieldSchema = {
  icon: boolean | { value: string; label: string }[] | undefined;
  name: string;
  label: string;
  type: string;
  options?: { value: string; label: string }[];
  optionsUrl?: string;
  value?: string;
  disable?: boolean;
  rowspan?: number;
  colspan?: number;
  columns?: gridColumn[];
  rows?: FieldSchema[];
  dataAPI?: string;
  required?: boolean;
  fields?: FieldSchema[]; // Make fields optional to handle cases where it's undefined
  fieldName: string;
  displayName: string;
  primaryKey: boolean;
  field: any;
};

export type MastersProps = {
  type: string;
  columns: any;
  schema: FieldSchema[];
  importTable: string;
  hideAddUsers: boolean;
  hideActions: boolean;
  submissionType?: SubmissionType;
};

export type Schema = {
  fields?: FieldSchema[];
  some?: (predicate: (field: FieldSchema) => boolean) => boolean;
  find?: (
    predicate: (field: FieldSchema) => boolean
  ) => FieldSchema | undefined;
};

export type Props = {
  schema?: Schema;
};

export type TabbedViewProps = {
  schema: {
    tabname: string;
    tablabel: string;
    fields: FieldSchema[];
    showSave?: boolean;
    showCancel?: boolean;
    saveAPI?: string;
  }[];
  defaultTab: string;
  type: string;
};

export type FieldType =
  | "input"
  | "password"
  | "select"
  | "primary"
  | "status"
  | "textarea"
  | "upload"
  | "date"
  | "primary-code";

export type gridColumn = {
  title: string;
  dataIndex: string;
  key: string;
};
export type TableData = {
  key: string;
  [key: string]: any;
};

export type TableColumn = ColumnType<TableData> & {
  title: string;
  dataIndex: string;
  routeURL?: string;
  [key: string]: any;
  dataType?: any;
  render?: (text: any, record: TableData) => JSX.Element;
};
