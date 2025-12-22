import React, { useState } from "react";
import { Button } from "@mantine/core";
import { IoMdAdd } from "react-icons/io";
import SchedulesList from "../Components/Schedules/SchedulesGroupList";
import { translations } from "@utils";
import ModalGroup from "@components/Schedules/ModalGroup";
import { PageHeader } from "@components";
import Can from "../Components/CanComponent/Can";

const language = localStorage.getItem("language") || "RO";

export const Schedules = () => {
  const [opened, setOpened] = useState(false);
  const [reload, setReload] = useState(false);
  const [inGroupView, setInGroupView] = useState(false);

  return (
    <div style={{ padding: "20px" }}>
      {!inGroupView && (
        <PageHeader
          title={translations["Orar"][language]}
          extraInfo={
            <Can permission={{ module: "schedules", action: "create" }} skipContextCheck>
              <Button
                leftSection={<IoMdAdd size={16} />}
                ml="auto"
                onClick={() => setOpened(true)}
              >
                {translations["Adaugă grup"][language]}
              </Button>
            </Can>
          }
        />
      )}

      <SchedulesList reload={reload} setInGroupView={setInGroupView} />

      <ModalGroup
        opened={opened}
        onClose={() => setOpened(false)}
        onGroupCreated={() => {
          setOpened(false);
          setReload((r) => !r);
        }}
      />
    </div>
  );
};
