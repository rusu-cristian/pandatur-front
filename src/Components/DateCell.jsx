import { Flex, Text } from "@mantine/core";
import { cleanValue, formattedDate } from "./utils";

export const DateCell = ({ date, gap, direction = "column", ...props }) => {
  const { formateDate, formateTime } = formattedDate(date);

  return (
    <>
      {date ? (
        <Flex direction={direction} gap={gap} {...props}>
          <Text>{formateDate}</Text>
          <Text>{formateTime}</Text>
        </Flex>
      ) : (
        cleanValue(date)
      )}
    </>
  );
};
