import { IoMdArrowDropup, IoMdArrowDropdown } from "react-icons/io"
import "./HeaderCell.css"

export const HeaderCellRcTable = ({ title, sortable, order }) => {
  return (
    <div className="d-flex align-items-center justify-content-center pointer gap-8 | table-thead-sort">
      <div>{title}</div>

      {order && (
        <div className="d-flex align-items-center">
          {order === "ASC" ? <IoMdArrowDropdown /> : <IoMdArrowDropup />}
        </div>
      )}
    </div>
  )
}
