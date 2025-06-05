import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import useApiRequest from "../../hooks/useApiRequest";
import { useDispatch } from "react-redux";
import { Layout, Spin } from "antd";
import ExamFooter from "../../components/layouts/ExamFooter";
import ExamHeader from "../../components/layouts/ExamHeader";
import RichTextViewer from "../../components/editor/RichTextViewer";
import { getQuestionNumbers } from "../../utils";
import { initilalizeExam } from "../../store/examReducer";

const { Content } = Layout;

const ListeningExam = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const [selectPart, setSelectPart] = useState();
  const [audios, setAudios] = useState([]);
  const [currentAudioIndex, setCurrentAudioIndex] = useState(0);
  const [questions, setQuestions] = useState();
  const audioRef = useRef(null);
  const { data, error, loading } = useApiRequest(
    `api/v1/exam/module/${id}?moduleType=listening`
  );

  useEffect(() => {
    if (data?.data && data.data.length > 0) {
      setSelectPart(data.data[0].type);
      setAudios(data?.data.map((dat) => dat.audio));
    }
  }, [data]);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
  
    window.addEventListener("beforeunload", handleBeforeUnload);
  
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    if (data && data.data) {
      dispatch(initilalizeExam(data.data));
    }
  }, [data]);

  useEffect(() => {
    if (selectPart) {
    const filteredQuestions = data?.data?.filter(
      (question) => question.type === selectPart
    );
    setQuestions(filteredQuestions[0]?.questions);
  }
  }, [selectPart])

  useEffect(() => {    
    if (audios.length === 0 || !audioRef.current) return;

    if (currentAudioIndex >= audios.length) return;

    const audioEl = audioRef.current;
    audioEl.src = audios[currentAudioIndex];
    console.log("Playing audio: ", audios[currentAudioIndex], " currentIndex: ", currentAudioIndex);
    
    audioEl.play().catch(err => 
      console.error("Audio playback failed:", err)
    );
    const handleEnded = () => {
      setTimeout(() => {
        setCurrentAudioIndex((prev) => prev + 1);
      }, 30000);
    };

    audioEl.addEventListener("ended", handleEnded);

    return () => {
      audioEl.removeEventListener("ended", handleEnded);
    };
  }, [currentAudioIndex, audios]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <h2>Error loading exam data</h2>
      </div>
    );
  }

  return (
    <Layout style={{ position: "relative", height: "100vh" }}>
      <ExamHeader type={"listening"} />
      <Content style={{ padding: "40px", overflowY: "auto" }}>
      <audio ref={audioRef} autoPlay />
        {questions &&
          questions.map((question) => (
            <div key={question.id}>
              <p style={{ fontSize: "20px", fontWeight: "bold" }}>
                Questions {getQuestionNumbers(question)}
              </p>
              <RichTextViewer content={question.content} type={question.type} />
            </div>
          ))}
      </Content>
      <ExamFooter selectPart={selectPart} setSelectPart={setSelectPart} />
    </Layout>
  );
};

export default ListeningExam;
