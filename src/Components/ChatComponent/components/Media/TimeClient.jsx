import { Flex, Text } from "@mantine/core";
import { FaFingerprint } from "react-icons/fa6";
import { MdOutlineAccessTime } from "react-icons/md";

export const TimeClient = ({ date, id }) => {
  return (
    <>
      {date && (
        <Flex gap="4" align="center">
          <MdOutlineAccessTime size={12} />
          <Text size="xs">{date}</Text>
        </Flex>
      )}
      {id && (
        <Flex gap="4" align="center">
          <FaFingerprint size={12} />
          <Text size="xs">{id}</Text>
        </Flex>
      )}
    </>
  );
};
