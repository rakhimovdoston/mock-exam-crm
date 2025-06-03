import React, { useState, useEffect } from "react";
import { Select, Button, Card, Spin, Result, Row, Col, Pagination } from "antd";
import { useNavigate } from "react-router-dom";
import emptyCart from "../../assets/not_found.svg";
import useApiRequest from "../../hooks/useApiRequest"; // Adjust the import path as necessary

const Writing = () => {
  const navigate = useNavigate();
  const [type, setType] = useState("all");
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10); // Number of items per page

  // Update the API request URL dynamically based on type and currentPage
  const { loading, data } = useApiRequest(
    `/api/v1/writing/all?type=${type}&page=${currentPage}&size=${pageSize}`,
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
            style={{ width: 200 }}
            onChange={(value) => setType(value)}
          >
            <Option value="all">All</Option>
            <Option value="true">Part 1</Option>
            <Option value="false">Part 2</Option>
          </Select>
          <Button type="primary" onClick={() => navigate("create")}>
            Add New Writing
          </Button>
        </div>
      </div>

      <div>
        {loading ? (
          <div style={{ textAlign: "center", padding: "24px" }}>
            <Spin size="large" />
          </div>
        ) : data?.code !== 200 ? (
          <Result
            subTitle="You have not added any writing module yet, please add one."
            style={{ textAlign: "center", padding: "24px" }}
            icon={
              <img
                src={emptyCart}
                alt="No Data"
                style={{ width: "300px", height: "300px" }}
              />
            }
            extra={
              <Button type="primary" onClick={() => navigate("create")}>
                Add New Writing
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
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      marginBottom: "16px",
                      borderColor: reading.active ? "#d9d9d9" : "#ff4d4f",
                      borderRadius: "8px",
                      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "18px",
                        fontWeight: "bold",
                        color: "#595959",
                        textDecoration: "none",
                      }}
                    >
                      {reading.title}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: "8px",
                      }}
                    >
                      <div>
                        <p
                          style={{
                            padding: "4px 12px",
                            borderRadius: "16px",
                            backgroundColor: "#f0f0f0",
                            color: "#595959",
                          }}
                        >
                          {reading.task === true ? "Part 1" : "Part 2"}
                        </p>
                      </div>
                      {reading.image && (
                        <img
                          src={reading.image}
                          alt={reading.title}
                          style={{
                            width: "250px",
                            height: "auto",
                            borderRadius: "8px",
                            marginBottom: "16px",
                          }}
                        />
                      )}
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
              current={currentPage + 1}
              pageSize={pageSize}
              showSizeChanger={false}
              total={data?.data?.totalSizes} 
              showTotal={(total) => `Total ${total} items`}
              onChange={(page) => setCurrentPage(page)}
              style={{ textAlign: "right", marginTop: "24px" }}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default Writing;
