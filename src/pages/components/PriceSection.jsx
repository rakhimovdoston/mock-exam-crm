import React, { useState } from "react";
import { Row, Col, Card, Typography, Button, Tag, Modal } from "antd";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";

const { Title, Paragraph } = Typography;

const plans = [
  {
    name: "Free Plan",
    price: "0",
    description: [
      "✔ 1 Full Mock Test",
      "✖️ No Progress Reports",
      "✖️ No feedback explanations",
    ],
    tag: "Free trial",
    tagColor: "processing",
    buttonText: "Demo Test",
  },
  // {
  //   name: "Premium Plan",
  //   price: "$19.99 / month",
  //   description: [
  //     "✔ Unlimited Mock Tests",
  //     "✔ Band Score Reports",
  //     "✔ Answer Explanations",
  //     "✔ Transcripts + AI Evaluation",
  //   ],
  //   tag: "Most Popular",
  //   tagColor: "processing",
  //   buttonText: "Upgrade Now",
  //   highlighted: true,
  // },
  // {
  //   name: "Single Test",
  //   price: "$4.99",
  //   description: [
  //     "✔ 1 Full Mock Test",
  //     "✔ Band Score & Feedback",
  //     "✖️ No History Tracking",
  //     "✖️ Transcripts + AI Evaluation",
  //   ],
  //   tag: "Pay Once",
  //   tagColor: "processing",
  //   buttonText: "Buy Now",
  // },
  {
    name: "IELTS Mock Test",
    price: "100,000 sum",
    description: [
      "✔ 1 Full Mock Test",
      "✔ Band Score & Feedback",
      "✔ Feedback explanations",
    ],
    tag: "Recommended",
    tagColor: "success",
    buttonText: "Payment",
    paymentDetails: {
      cardNumber: "8600 XXXX XXXX XXXX",
      telegramBot: "https://t.me/d0st0nj0n",
    },
  },
];

const PricingSection = () => {
  const [openModal, setOpenModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  return (
    <section
      id="pricing-section"
      style={{
        padding: "20px",
        background: "#fff",
      }}
    >
      <Modal
        title="Payment Details"
        open={openModal}
        onCancel={() => setOpenModal(false)}
        footer={null}
      >
        {selectedPlan && (
          <div style={{ lineHeight: 2 }}>
            <p>
              💳 <strong>Card number:</strong>{" "}
              {selectedPlan.paymentDetails.cardNumber}
            </p>
            <p>
              📩 <strong>Send a payment screenshot:</strong>{" "}
              <a
                href={selectedPlan.paymentDetails.telegramBot}
                target="_blank"
                rel="noopener noreferrer"
              >
                Telegram
              </a>
            </p>
            <p>✅ After payment, you will be able to access the test...</p>
          </div>
        )}
      </Modal>

      <Title level={2} style={{ textAlign: "center", marginBottom: 20 }}>
        Pricing
      </Title>

      <Row gutter={[32, 32]} justify="center">
        {plans.map((plan, index) => (
          <Col xs={24} sm={12} md={8} key={index}>
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <Card
                style={{
                  borderRadius: 24,
                  textAlign: "center",
                  padding: "24px 16px",
                  boxShadow: "0 8px 30px rgba(0, 0, 0, 0.05)",
                  background: "#ffffff",
                  height: "400",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <Tag
                  color={plan.tagColor}
                  style={{ fontSize: 14, marginBottom: 10 }}
                >
                  {plan.tag}
                </Tag>

                <Title level={3} style={{ color: "#e31837" }}>
                  {plan.name}
                </Title>

                <Paragraph style={{ margin: "24px 0", textAlign: "left" }}>
                  {plan.description.map((line, i) => {
                    const isIncluded =
                      line.trim().startsWith("✔") ||
                      line.trim().startsWith("✅");
                    const icon = isIncluded ? (
                      <CheckOutlined
                        style={{ color: "#52c41a", marginRight: 8 }}
                      />
                    ) : (
                      <CloseOutlined
                        style={{ color: "#666", marginRight: 8 }}
                      />
                    );
                    const text = line.replace(/^✔|^✖️|^❌|^✅/, "").trim();

                    return (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          marginBottom: 6,
                        }}
                      >
                        {icon}
                        <span>{text}</span>
                      </div>
                    );
                  })}
                </Paragraph>

                <Title
                  level={4}
                  style={{
                    marginBottom: 30,
                    fontWeight: "bold",
                    fontSize: 22,
                    color: "#333",
                  }}
                >
                  {plan.price}
                </Title>

                <Button
                  type="primary"
                  size="large"
                  onClick={() => {
                    setSelectedPlan(plan);
                    setOpenModal(true);
                  }}
                  shape="round"
                  style={{
                    backgroundColor: "#e31837",
                    borderColor: "#e31837",
                    padding: "6px 28px",
                  }}
                >
                  {plan.buttonText}
                </Button>
              </Card>
            </motion.div>
          </Col>
        ))}
      </Row>
    </section>
  );
};

export default PricingSection;
