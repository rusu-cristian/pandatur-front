import { useState } from "react";
import { Flex, Button } from "@mantine/core";
import { getLanguageByKey } from "@utils";
import { MessagesLogItem } from "../Message";

const MAX_LOGS_COLLAPSED = 5;

export const LogCluster = ({ logs = [], technicians }) => {
  const [expanded, setExpanded] = useState(false);

  const collapsedStart = Math.max(0, logs.length - MAX_LOGS_COLLAPSED);
  const lastFive = logs.slice(collapsedStart);
  const visible = expanded ? logs : lastFive;
  const hidden = expanded ? 0 : collapsedStart;

  return (
    <Flex direction="column">
      {visible.map((l, i) => {
        const logKey = String(l.id ?? `${l.timestamp}-${i}`);
        return (
          <MessagesLogItem
            key={`log-${logKey}`}
            log={l}
            technicians={technicians}
            isLive={l.isLive}
          />
        );
      })}

      {logs.length > MAX_LOGS_COLLAPSED && (
        <Flex justify="center" mt={4}>
          <Button size="xs" variant="light" onClick={() => setExpanded((v) => !v)}>
            {expanded ? getLanguageByKey("Collapse") : `${getLanguageByKey("ShowMore")} ${hidden}`}
          </Button>
        </Flex>
      )}
    </Flex>
  );
};

export default LogCluster;
