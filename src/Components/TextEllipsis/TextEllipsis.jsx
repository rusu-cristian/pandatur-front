import { Text } from "@mantine/core";
import "./TextEllipsis.css";

export const TextEllipsis = ({ rows = 1, children }) => {
  return (
    <Text style={{ "--rows": rows }} className="ellipsis">
      {children}
    </Text>
  );
};
