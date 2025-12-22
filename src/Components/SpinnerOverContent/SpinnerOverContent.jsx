import { Spin } from "../Spin"
import "./SpinnerOverContent.css"

export const SpinnerOverContent = ({ loading }) => {
  return (
    <>
      {loading && (
        <div className="spinner-over-content">
          <Spin />
        </div>
      )}
    </>
  )
}
