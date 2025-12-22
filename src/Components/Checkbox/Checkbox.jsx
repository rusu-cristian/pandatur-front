import "./Checkbox.css"

export const Checkbox = ({ checked, onChange, ...props }) => {
  return (
    <input
      className="checkbox"
      type="checkbox"
      checked={checked}
      onChange={onChange}
      {...props}
    />
  )
}
