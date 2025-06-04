import React, { useState, useEffect } from "react";
import { Select, Button, Card, Spin, Result, Row, Col, Pagination } from "antd";
import { Link } from "react-router-dom";
import emptyCart from "../../assets/not_found.svg"; // Adjust the path as necessary
import ListeningModal from "../../components/modal/ListeningModal";
import useApiRequest from "../../hooks/useApiRequest";

const { Option } = Select;

const Listening = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [type, setType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10); // Number of items per page

  const { data, loading } = useApiRequest(
    `/api/v1/listening/all?type=${type}&page=${currentPage-1}&size=${pageSize}`,
    [type, currentPage]
  );

  useEffect(() => {
    // Update the URL query parameters when the page changes
    const queryParams = new URLSearchParams();
    queryParams.set("type", type);
    queryParams.set("page", currentPage);
    queryParams.set("pageSize", pageSize);
    window.history.replaceState(null, "", `?${queryParams.toString()}`);
  }, [type, currentPage, pageSize]);

  const getPassage = (difficulty) => {
    switch (difficulty) {
      case "part_1":
        return "Listening Part 1";
      case "part_2":
        return "Listening Part 2";
      case "part_3":
        return "Listening Part 3";
      default:
        return "Listening Part 4";
    }
  };

  return (
    <div style={{ padding: "24px" }}>
      <div style={{ marginBottom: "24px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Select
            defaultValue={type}
            onChange={(e) => setType(e)}
            style={{ width: 200 }}
          >
            <Option value="all">All</Option>
            <Option value="part_1">Listening Part 1</Option>
            <Option value="part_2">Listening Part 2</Option>
            <Option value="part_3">Listening Part 3</Option>
            <Option value="part_4">Listening Part 4</Option>
          </Select>
          <Button type="primary" onClick={() => setModalVisible(true)}>
            Add New Listening
          </Button>
        </div>
      </div>
      <ListeningModal visible={modalVisible} onClose={setModalVisible} />
      <div>
        {loading ? (
          <div style={{ textAlign: "center", padding: "24px" }}>
            <Spin size="large" />
          </div>
        ) : data?.code !== 200 ? (
          <Result
            subTitle="You have not added any listening passage yet, please add one."
            style={{ textAlign: "center", padding: "24px" }}
            icon={
              <img
                src={emptyCart}
                alt="No Data"
                style={{ width: "300px", height: "300px" }}
              />
            }
            extra={
              <Button type="primary" onClick={() => setModalVisible(true)}>
                Add New Listening
              </Button>
            }
          />
        ) : (
          <>
            <Row gutter={[16, 16]}>
              {data?.data?.data.map((reading) => (
                <Col xs={24} sm={12} md={12} lg={12} key={reading.id}>
                  <Card
                    key={reading.id}
                    style={{
                      marginBottom: "16px",
                      borderColor: reading.active ? "#d9d9d9" : "#ff4d4f",
                      borderRadius: "8px",
                      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    <Link
                      to={`${reading.id}`}
                      style={{
                        fontSize: "18px",
                        fontWeight: "bold",
                        color: "#595959",
                        textDecoration: "none",
                      }}
                    >
                      {reading.title}
                    </Link>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "start",
                        marginTop: "8px",
                      }}
                    >
                      <p
                        style={{
                          padding: "4px 12px",
                          borderRadius: "16px",
                          backgroundColor: "#f0f0f0",
                          color: "#595959",
                        }}
                      >
                        {getPassage(reading.type)}
                      </p>
                    </div>
                    {!reading.active && (
                      <p
                        style={{
                          color: "#ff4d4f",
                          fontWeight: "bold",
                          fontSize: "12px",
                          marginTop: "8px",
                        }}
                      >
                        This question does not have answers yet.
                      </p>
                    )}
                  </Card>
                </Col>
              ))}
            </Row>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              showSizeChanger={false}
              showTotal={(total) => `Total ${total} items`}
              total={data?.data?.totalSizes}
              align="right"
              onChange={(page) => setCurrentPage(page)}
              style={{ textAlign: "right", marginTop: "24px" }}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default Listening;
