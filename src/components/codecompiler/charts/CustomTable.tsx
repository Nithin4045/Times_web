import React, { useState } from 'react';
import { Table, Input, Button, Space, Empty } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { TableData, TableColumn } from '@/utils/codecompiler/types';
import { useRouter } from 'next/navigation';

type CustomTableProps = {
  data: {
    data: TableData[];
    columns: TableColumn[];
  };
  onRow?: (record: TableData) => React.HTMLProps<HTMLTableRowElement>; // Allows passing custom onRow function
};

const CustomTable: React.FC<CustomTableProps> = ({ data, onRow }) => {
  const { data: tableData, columns } = data;
  const [searchText, setSearchText] = useState<string>('');
  const [searchedColumn, setSearchedColumn] = useState<string | null>('');
  const [currentPage, setCurrentPage] = useState<number>(1); // State to track current page
  const [pageSize, setPageSize] = useState<number>(10); // State to track page size
  const router = useRouter();

  const handleColumnClick = (record: TableData, column: TableColumn) => {
    if (column.routeURL) {
      router.push(`/${column.routeURL}`);
    }
  };

  const handleSearch = (selectedKeys: string, confirm: () => void, dataIndex: string) => {
    confirm();
    setSearchText(selectedKeys || '');
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters: () => void) => {
    clearFilters();
    setSearchText('');
    setSearchedColumn(null);
  };

  const getColumnSearchProps = (dataIndex: string) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
      <div style={{ padding: 8 }}>
        <Input
          // placeholder={`Search ${dataIndex}`}
          value={selectedKeys}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys[0], confirm, dataIndex)}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys[0], confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button onClick={() => {handleReset(clearFilters),handleSearch(selectedKeys[0], confirm, dataIndex)}} size="small" style={{ width: 90 }}>
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? '#fff' : '#fff' }} />
    ),
    onFilter: (value: string, record: any) =>
      record[dataIndex]
        ? record[dataIndex].toString().toLowerCase().includes(value.toLowerCase())
        : '',
    render: (text: string) =>
      searchedColumn === dataIndex ? (
        <span>
          {text.toString().toLowerCase().includes(searchText.toLowerCase()) ? (
            <span style={{ backgroundColor: '#ffc069', padding: 0 }}>{text}</span>
          ) : (
            text
          )}
        </span>
      ) : (
        text
      ),
  });

  // Add sorting capabilities
  const getSorterProps = (dataIndex: string,dataType:any) => ({
    sorter: (a: TableData, b: TableData) => {
      const aValue = a[dataIndex] ? a[dataIndex].toString().toLowerCase() : '';
      const bValue = b[dataIndex] ? b[dataIndex].toString().toLowerCase() : '';
      return dataType=='number'?aValue-bValue:aValue.localeCompare(bValue);
    },
    sortDirections: ['ascend', 'descend'],
  });

  const modifiedColumns: any = columns.map((column) => ({
    ...column,
    ...getColumnSearchProps(column.dataIndex),
    ...getSorterProps(column.dataIndex, column?.dataType),
    onCell: (record: TableData) => ({
      onClick: () => handleColumnClick(record, column),
      // className: column.dataIndex.startsWith('period') ? 'cursor-pointer' : '',
    }),
    render: column.render
      ? column.render // Use the render function if provided in the column
      : (text: string, record: TableData) => (
          <span style={{ color: column.dataIndex.startsWith('period') ? '#3b82f6' : 'inherit' }}>
            {column.dataIndex.startsWith('period') ? (
              <Button
                type="link"
                className="cursor-pointer"
                onClick={(e: any) => {
                  e.stopPropagation(); // Prevent triggering the row click
                  handleColumnClick(record, column);
                }}
              >
                {text}
              </Button>
            ) : (
              text
            )}
          </span>
        ),
  }));
  

  // Pagination configuration
  const handlePageChange = (page: number, pageSize: number) => {
    setCurrentPage(page);
    setPageSize(pageSize);
  };

  return (
    <div>
    {/* <div className="overflow-x-auto"> */}
      <Table className = "CC_Table" 
        dataSource={tableData.length > 0 ? tableData : undefined}
        columns={modifiedColumns}
        pagination={{
          current: currentPage, // Set the current page
          pageSize: pageSize,   // Set the page size
          total: tableData.length, // Total number of records
          onChange: handlePageChange, // Handle page change
          showSizeChanger: true, // Enable page size changer
          pageSizeOptions: ['10', '20', '50'], // Page size options
        }}
        rowKey="key"
        locale={{
          emptyText: <Empty description="No data available" />,
        }}
        onRow={onRow} // Pass onRow prop to handle row clicks
      />
    </div>
  );
};

export default CustomTable;
