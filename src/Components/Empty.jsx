import { GoArchive } from "react-icons/go";
import { Flex, Text, DEFAULT_THEME } from "@mantine/core";

const renderContentEmpty = (title) => (
  <>
    <div className="mb-16">
      <GoArchive size={64} />
    </div>

    <Text>{title}</Text>
  </>
);

export const Empty = ({ renderEmptyContent, title }) => {
  return (
    <>
      {renderEmptyContent ? (
        renderEmptyContent(renderContentEmpty)
      ) : (
        <Flex
          justify="center"
          align="center"
          direction="column"
          c={DEFAULT_THEME.colors.dark[2]}
        >
          {renderContentEmpty(title)}
        </Flex>
      )}
    </>
  );
};
