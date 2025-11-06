import React, { useState } from "react";
import { message } from "antd";
type ImportExcelToSQLProps = {
  table: string;
  subfolder: string;
}

const ImportExcelToSQL: React.FC<ImportExcelToSQLProps> = ({ table, subfolder }) => {
  const [file, setFile] = useState<File | null>(null);
  const [imported, setImported] = useState(false);

  const handleUpload = async (e: any) => {
    e.preventDefault();
    if (!file) return;

    try {
      const data = new FormData();
      data.set("file", file);

      const res = await fetch(`/api/import?subfolder=${subfolder}&table=${table}`, {
        method: "POST",
        body: data,
      });
      console.log(res.ok);
      if (!res.ok) {
        message.error("Import Failed, Please try again!");
        throw new Error(await res.text());
      } else {
        setImported(true);
        message.success("Imported Successfully!!");
      }
    } catch (e: any) {
      // Handle errors here
      console.error(e);
    }
  };

  return (
    <div>
      <input
        type="file"
        name="file"
        style={{ width: "260px", marginRight: "5px" }}
        onChange={(e: any) => setFile(e.target.files?.[0])}
      />
      <input
        type="submit"
        style={{ width: "100px", cursor: "pointer" }}
        value="Import"
        onClick={handleUpload}
        className="button"
      />
    </div>
  );
};

export default ImportExcelToSQL;
