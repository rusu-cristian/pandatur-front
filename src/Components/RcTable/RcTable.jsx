import Table from "rc-table";
import { getLanguageByKey } from "@utils";
import { Empty, Spin } from "@components";
import "./RcTable.css";

const renderSpinOrEmptyBox = (isLoading) => {
  if (isLoading) {
    return (
      <div className="table-spinner-loading">
        <Spin />
      </div>
    );
  }

  return <Empty title={getLanguageByKey("noDate")} />;
};

export const RcTable = ({
  columns,
  data,
  pagination,
  bordered,
  selectedRow,
  loading,
  ...props
}) => {
  return (
    <div className="table-container-custom">
      <Table
        className="table"
        tableLayout="fixed"
        emptyText={renderSpinOrEmptyBox(loading)}
        rowClassName={({ id }) =>
          `${bordered ? "border" : ""} ${selectedRow?.includes(id) ? "row-selection" : ""}`
        }
        columns={columns}
        data={data}
        scroll={{ x: true }}
        {...props}
      />
    </div>
  );
};
