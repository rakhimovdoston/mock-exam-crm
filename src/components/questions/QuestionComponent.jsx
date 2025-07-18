// Enhanced version of your QuestionComponent with react-beautiful-dnd

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import useApiRequest from "../../hooks/useApiRequest";
import { Button, Select, Skeleton, Typography } from "antd";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import {
  existMatchingHeadingsQuestions,
  getInitValue,
  getLastQuestionId,
  getQuestionNumbers,
  getQuestionNumbersForHeadins,
  getStartByQuestionType,
  getTitle,
  isMatchinHeadings,
  renumberSlateQuestionsSmart,
} from "../../utils";
import DeleteModal from "../modal/DeleteModal";
import UpdateModal from "../modal/UpdateModal";
import RichTextViewer from "../editor/RichTextViewer";
import { useDispatch } from "react-redux";
import { initializeAnswers, setAnswers } from "../../store/answerReducer";
import QuestionModal from "../modal/QuestionModal";
import { readings_inits } from "../../data/reading";
import { setQuestionType } from "../../store/questionReducer";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { toast } from "react-toastify";
import { listening_inits } from "../../data/listening";
import apiClient from "../../services/api";

const { Option } = Select;

const QuestionComponent = ({ type, difficultType, countLists }) => {
  const { id } = useParams();
  const [isDelete, setDelete] = useState(false);
  const [selectQuestionType, setSelectQuestionType] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [isUpdate, setUpdate] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [initKeys, setInitKeys] = useState([]);
  const dispatch = useDispatch();

  const questionTypes = useApiRequest(
    `/api/v1/question-type/all?type=${
      type === "reading" ? "READING" : "LISTENING"
    }`
  );

  const { data, loading, error } = useApiRequest(
    type === "listening"
      ? `/api/v1/listening/${id}/get`
      : `/api/v1/reading/passage/${id}/questions`,
    [id, refresh]
  );

  useEffect(() => {
    if (data && data.data?.questions) {
      const multiAnswerKeys = data.data.questions
        .filter((q) => q.type === "Multiple Choice (Multiple answers)")
        .map((q) => getQuestionNumbers(q));

      setInitKeys([...new Set(multiAnswerKeys)]);
    }
  }, [data]);

  useEffect(() => {
    if (data && data.data) {
      const questionsAnswers = data.data.answers;
      setQuestions(data.data.questions);
      if (questionsAnswers && questionsAnswers.length > 0) {
        dispatch(setAnswers(questionsAnswers));
        return;
      }
      const startByQuestionType =
        getStartByQuestionType(
          difficultType,
          type === "listening" ? "LISTENING" : "READING"
        ) + 1;
      let lastQuestionId = getLastQuestionId(data?.data.questions);
      lastQuestionId = isMatchinHeadings(data?.data.questions)
        ? lastQuestionId
          ? lastQuestionId + countLists
          : startByQuestionType + countLists - 1
        : lastQuestionId;
      if (lastQuestionId > 0) {
        dispatch(
          initializeAnswers({
            numberOfAnswers: lastQuestionId,
            startNumber: startByQuestionType,
            initKeys: initKeys,
          })
        );
      }
    }
  }, [data, initKeys]);

  // const handleDragEnd = async (result) => {
  //   if (!result.destination) return;
  //   const reordered = Array.from(questions);
  //   const [movedItem] = reordered.splice(result.source.index, 1);
  //   reordered.splice(result.destination.index, 0, movedItem);
  //   const updateQuestions = [];
  //   let count = 1;
  //   for (const ques of reordered) {
  //     const start = getStart(updateQuestions);
  //     updateQuestions.push({
  //       id: ques.id,
  //       type: ques.type,
  //       content: renumberSlateQuestionsSmart(ques.content, start + 1),
  //       order: count,
  //     });
  //     count = count + 1;
  //   }
  //   const requestBody = {
  //     questions: updateQuestions.map((ques) => {
  //       return {
  //         id: ques.id,
  //         questionType: ques.type,
  //         questionContent: ques.content,
  //         order: ques.order,
  //       };
  //     }),
  //   };
  //   try {
  //     const response = await apiClient.put(
  //       `api/v1/${type}/update/${id}/questions`,
  //       requestBody
  //     );
  //     if (response.code != 200) {
  //       toast.error(response.error || "Failed delete message");
  //       return;
  //     }
  //     setRefresh(!refresh);
  //   } catch (error) {
  //     toast.error("Reordering failed to save");
  //   }
  //   setQuestions(updateQuestions);
  // };

  if (loading) return <Skeleton active />;
  if (!data || error)
    return (
      <Typography.Text type="danger">Error: {error?.message}</Typography.Text>
    );

  const getStart = (questions) => {
    let lastQuestionNumber = getLastQuestionId(questions);
    // difficultType
    const startByQuestionType = getStartByQuestionType(
      difficultType,
      type === "listening" ? "LISTENING" : "READING"
    );

    lastQuestionNumber = isMatchinHeadings(data?.data?.questions)
      ? lastQuestionNumber
        ? lastQuestionNumber + countLists
        : startByQuestionType + countLists
      : lastQuestionNumber;
    return lastQuestionNumber > 0
      ? lastQuestionNumber
      : startByQuestionType + lastQuestionNumber;
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Select
          style={{ width: 250 }}
          value={selectQuestionType}
          onChange={(value) => {
            dispatch(setQuestionType(value));
            setSelectQuestionType(value);
          }}
          placeholder="Select question type"
        >
          <Option value="all" disabled>
            Select question types:
          </Option>
          {questionTypes?.data?.data?.map((type) => (
            <Option key={type.id} value={type.type}>
              {type.name}
            </Option>
          ))}
        </Select>
        <Button
          type="primary"
          onClick={() => {
            if (selectQuestionType === "all") {
              toast.error("Please select a question type first.");
              return;
            }
            setIsModalOpen(true);
          }}
        >
          Add question
        </Button>
      </div>

      {/* <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="questions">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps}> */}
      <div style={{ marginTop: 16 }}>
        {questions.map((question, index) => (
          // <Draggable draggableId={String(question.id)} index={index} key={question.id}>
          //   {(provided, snapshot) => (
          //     <div
          //       ref={provided.innerRef}
          //       {...provided.draggableProps}
          //       {...provided.dragHandleProps}
          //       style={{
          //         background: snapshot.isDragging ? "#e6f7ff" : "white",
          //         padding: 16,
          //         marginBottom: 8,
          //         border: "1px solid #ccc",
          //         borderRadius: 4,
          //         ...provided.draggableProps.style,
          //       }}
          //     >
          <div
            key={question.id}
            style={{
              background: "transparent",
              padding: 16,
              marginBottom: 8,
              border: "1px solid #ccc",
              borderRadius: 4,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <p style={{ fontSize: 20, fontWeight: "bold" }}>
                Questions{" "}
                {question.type === "Matching Headings"
                  ? getQuestionNumbersForHeadins(countLists, difficultType)
                  : getQuestionNumbers(question)}
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <Button
                  icon={<EditOutlined />}
                  onClick={() => {
                    setSelectedQuestion(question);
                    setUpdate(true);
                  }}
                />
                {question.type !== "Matching Headings" && (
                  <Button
                    icon={<DeleteOutlined />}
                    danger
                    onClick={() => {
                      setSelectedQuestion(question);
                      setDelete(true);
                    }}
                  />
                )}
              </div>
            </div>
            <RichTextViewer
              content={question.content}
              headings={countLists}
              type={question.type}
            />
          </div>
          //     )}
          // </Draggable>
        ))}
      </div>
      {/* {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext> */}

      <QuestionModal
        isOpen={isModalOpen}
        setOpen={setIsModalOpen}
        title={getTitle(selectQuestionType, questionTypes.data?.data)}
        type={selectQuestionType}
        initialValue={getInitValue(
          type === "reading" ? readings_inits : listening_inits,
          selectQuestionType
        )}
        reading={type === "reading"}
        startQuestionId={getStart(data?.data?.questions)}
        isRefresh={refresh}
        setRefresh={setRefresh}
      />

      {selectedQuestion && data?.data && (
        <>
          <DeleteModal
            number={getQuestionNumbers(selectedQuestion)}
            selectedQuestion={selectedQuestion}
            open={isDelete}
            questions={questions}
            setOpen={setDelete}
            type={type}
            start={
              existMatchingHeadingsQuestions(questions)
                ? countLists +
                  getStartByQuestionType(
                    difficultType,
                    type === "reading" ? "READING" : "LISTENING"
                  )
                : getStartByQuestionType(
                    difficultType,
                    type === "reading" ? "READING" : "LISTENING"
                  )
            }
            refresh={refresh}
            setRefresh={setRefresh}
          />
          <UpdateModal
            number={
              selectedQuestion.type === "Matching Headings"
                ? getStartByQuestionType(
                    difficultType,
                    type === "reading" ? "READING" : "LISTENING"
                  ) +
                  1 +
                  "-" +
                  (countLists +
                    getStartByQuestionType(
                      difficultType,
                      type === "reading" ? "READING" : "LISTENING"
                    ))
                : getQuestionNumbers(selectedQuestion)
            }
            selectedQuestion={selectedQuestion}
            open={isUpdate}
            questions={questions}
            setOpen={setUpdate}
            type={type}
            start={
              existMatchingHeadingsQuestions(questions)
                ? countLists +
                  getStartByQuestionType(
                    difficultType,
                    type === "reading" ? "READING" : "LISTENING"
                  )
                : getStartByQuestionType(
                    difficultType,
                    type === "reading" ? "READING" : "LISTENING"
                  )
            }
            refresh={refresh}
            setRefresh={setRefresh}
          />
        </>
      )}
    </div>
  );
};

export default QuestionComponent;
