import React from "react";

const HomeSection = () => {
  return (
    <Content>
      <div
        style={{
          position: "relative",
          scrollMarginTop: 100,
          overflow: "hidden",
        }}
      >
        <svg
          viewBox="0 0 1440 320"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 1,
            pointerEvents: "none",
          }}
          preserveAspectRatio="none"
        >
          {[...Array(5)].map((_, i) => (
            <path
              key={i}
              d={`
        M0,${60 + i * 40}
        C240,${400 + i * 60},
        1200,${-40 + i * 60},
        1440,${60 + i * 40}
      `}
              fill="none"
              stroke="url(#lineGradient)"
              strokeWidth="1.5"
              opacity="0.35"
            />
          ))}

          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#e31837" />
              <stop offset="100%" stopColor="#ff4081" />
            </linearGradient>
          </defs>
        </svg>

        <HeroSection setOpen={setOpen} />
      </div>

      <ScrollFadeIn>
        <div style={{ marginTop: 100, padding: "0 24px" }}>
          <Title level={3} style={{ textAlign: "center", marginBottom: 40 }}>
            How does this actually work?
          </Title>

          <Row gutter={[24, 24]} justify="center">
            {HOW_IT_WORKS_ITEMS.map((item, index) => (
              <Col key={index} xs={24} sm={12} md={8}>
                <Card
                  hoverable
                  style={{
                    borderRadius: 12,
                    overflow: "hidden",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
                    height: "100%",
                  }}
                >
                  <Image
                    src={item.media}
                    alt={item.title}
                    preview={true}
                    style={{
                      width: "100%",
                      objectFit: "contain",
                      borderRadius: 8,
                    }}
                  />
                  <div style={{ paddingTop: 16 }}>
                    <strong style={{ fontSize: 16 }}>{item.title}</strong>
                    <p style={{ margin: 0, color: "#555" }}>
                      {item.description}
                    </p>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </ScrollFadeIn>

      {/* Features Section */}
      <Row gutter={[24, 24]} justify="center" style={{ marginTop: 100 }}>
        {FEATURES.map((feature, index) => (
          <Col
            key={index}
            xs={24}
            sm={12}
            md={12}
            lg={8}
            xl={8}
            style={{ display: "flex", justifyContent: "center" }}
          >
            <ScrollFadeIn delay={index * 0.2}>
              <motion.div
                initial="hidden"
                animate="visible"
                variants={cardAnimation}
                whileHover={{ scale: 1.05 }}
                style={{ width: "100%", maxWidth: 400 }}
              >
                <Card
                  hoverable
                  style={{
                    textAlign: "center",
                    borderRadius: 16,
                    padding: 24,
                    backdropFilter: "blur(8px)",
                    background: "rgba(255, 255, 255, 0.75)",
                    boxShadow: "0 4px 30px rgba(0, 0, 0, 0.05)",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <img
                    src={feature.icon}
                    alt={feature.title}
                    width={280}
                    style={{ marginBottom: 20, objectFit: "contain" }}
                  />
                  <Title level={4} style={{ color: "#e31837" }}>
                    {feature.title}
                  </Title>
                  <Paragraph style={{ color: "#666" }}>
                    {feature.description}
                  </Paragraph>
                </Card>
              </motion.div>
            </ScrollFadeIn>
          </Col>
        ))}
      </Row>

      {/* Testimonial */}
      <ScrollFadeIn>
        <div style={{ textAlign: "center", marginTop: 120 }}>
          <Title level={3} italic style={{ maxWidth: 700, margin: "0 auto" }}>
            “This platform made preparing for IELTS less stressful and I loved
            the instant feedback on my mock exams.”
          </Title>
        </div>
      </ScrollFadeIn>

      <Divider style={{ margin: "" }} />

      {/* Call to Action */}
      <TestimonialSlider />
      <Divider style={{ marginTop: "40px" }} />

      <ScrollFadeIn>
        <PricingSection />
      </ScrollFadeIn>

      <ScrollFadeIn>
        <div id="faq-section" style={{ marginBottom: 100 }}>
          <Title level={3} style={{ textAlign: "center", marginBottom: 40 }}>
            Frequently Asked Questions
          </Title>
          <Row gutter={[16, 16]} style={{ padding: "24px" }}>
            <Col xs={24} md={24} lg={12}>
              <Collapse
                accordion
                expandIcon={({ isActive }) => (
                  <CaretRightOutlined rotate={isActive ? 90 : 0} />
                )}
                size="middle"
                style={{
                  background: token.colorBgContainer,
                  borderRadius: 12,
                }}
                items={faqs.slice(0, 3).map((faq) => ({
                  ...faq,
                  label: `❓ ${faq.label}`,
                }))}
              />
            </Col>
            <Col xs={24} md={24} lg={12}>
              <Collapse
                accordion
                expandIcon={({ isActive }) => (
                  <CaretRightOutlined rotate={isActive ? 90 : 0} />
                )}
                size="middle"
                style={{
                  background: token.colorBgContainer,
                  borderRadius: 12,
                }}
                items={faqs.slice(3, 6).map((faq) => ({
                  ...faq,
                  label: `❓ ${faq.label}`,
                }))}
              />
            </Col>
          </Row>
        </div>
      </ScrollFadeIn>

      <ScrollFadeIn>
        <div
          style={{
            background: "#fafafa",
            padding: "24px",
          }}
        >
          <Title level={3} style={{ textAlign: "center", marginBottom: 40 }}>
            Contact Us
          </Title>

          <Row justify="center">
            <Col xs={24} sm={20} md={16} lg={12}>
              <Card style={{ borderRadius: 16 }}>
                <Form
                  layout="vertical"
                  onFinish={(values) => {
                    console.log("Contact form submitted:", values);
                    alert("Thank you for reaching out!");
                  }}
                >
                  <Form.Item
                    label="Your Name"
                    name="name"
                    rules={[
                      { required: true, message: "Please enter your name" },
                    ]}
                  >
                    <Input placeholder="John Doe" />
                  </Form.Item>

                  <Form.Item
                    label="Email Address"
                    name="email"
                    rules={[
                      { required: true, message: "Please enter your email" },
                      { type: "email", message: "Invalid email format" },
                    ]}
                  >
                    <Input placeholder="you@example.com" />
                  </Form.Item>

                  <Form.Item
                    label="Message"
                    name="message"
                    rules={[
                      {
                        required: true,
                        message: "Please enter your message",
                      },
                    ]}
                  >
                    <Input.TextArea
                      rows={4}
                      placeholder="Write your message here..."
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button type="primary" htmlType="submit" block>
                      Send Message
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </Col>
          </Row>
        </div>
      </ScrollFadeIn>
    </Content>
  );
};

export default HomeSection;
