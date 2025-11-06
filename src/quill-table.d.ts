declare module 'quill-table' {
    import { Quill } from 'quill';
  
    class Table {
      static blotName: string;
      static tagName: string;
      static className: string;
    }
  
    class TableRow {
      static blotName: string;
      static tagName: string;
      static className: string;
    }
  
    class TableCell {
      static blotName: string;
      static tagName: string;
      static className: string;
    }
  
    export { Table, TableRow, TableCell };
  }
  