import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TaskComponent from "../Components/Task/TaskComponent";
import SingleChat from "@components/ChatComponent/SingleChat";
import { ChatModal } from "../Components/ChatComponent/ChatModal";
import { useGetTechniciansList } from "../hooks";

export const TaskPage = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const { technicians } = useGetTechniciansList();

  const handleCloseModal = () => navigate("/tasks");

  return (
    <>
      <TaskComponent tasks={tasks} setTasks={setTasks} />
      <ChatModal opened={!!ticketId} onClose={handleCloseModal}>
        <SingleChat ticketId={ticketId} onClose={handleCloseModal} tasks={tasks} technicians={technicians} />
      </ChatModal>
    </>
  );
};
