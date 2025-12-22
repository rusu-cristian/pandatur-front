import { Box, Flex, Text } from "@mantine/core";
import { FaRegFileLines } from "react-icons/fa6";
import { Link } from "react-router-dom";
import "./File.css";

export const File = ({ src, label, renderLabel, ...props }) => {
  return (
    <Link to={src} target="_blank">
      <Box className="file" p={8} {...props}>
        <Flex align="center" gap={8}>
          <FaRegFileLines size={32} />
          {renderLabel ? renderLabel() : <Text>{label}</Text>}
        </Flex>
      </Box>
    </Link>
  );
};
