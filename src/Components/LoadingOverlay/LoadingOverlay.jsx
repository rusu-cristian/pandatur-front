import { Spin } from "../Spin"
import "./LoadingOverlay.css"

export const LoadingOverlay = () => {
  return (
    <div className="loading-overlay">
      <Spin />
    </div>
  )
}
