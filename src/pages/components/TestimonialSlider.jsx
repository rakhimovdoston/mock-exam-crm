import React from "react";
import Slider from "react-slick";
import { Typography, Card } from "antd";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const { Title, Paragraph } = Typography;

const testimonials = [
  {
    name: "Abdumalik",
    comment:
      "This platform gave me the real IELTS experience. The AI feedback was spot on!",
  },
  {
    name: "Bekzod",
    comment:
      "I tried many mock tests before, but this one felt just like the real exam. Highly recommended!",
  },
  {
    name: "Dilshod",
    comment:
      "sign-up hassle — just real testing! Helped me build my confidence.",
  },
];

const sliderSettings = {
  dots: true,
  infinite: true,
  speed: 600,
  slidesToShow: 1,
  slidesToScroll: 1,
  autoplay: true,
  autoplaySpeed: 5000,
};

const TestimonialSlider = () => {
  const getCardStyle = (variant) => {
    switch (variant) {
      case "gradient":
        return {
          background:
            "linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(227, 24, 55, 0.1))",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(227, 24, 55, 0.3)",
          boxShadow: "0 10px 35px rgba(227, 24, 55, 0.2)",
        };
      case "dark":
        return {
          background: "rgba(18, 18, 18, 0.6)",
          backdropFilter: "blur(6px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 12px 40px rgba(0, 0, 0, 0.4)",
          color: "white",
        };
      default:
        return {
          background: "rgba(255, 255, 255, 0.25)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255, 255, 255, 0.4)",
          boxShadow: "0 8px 30px rgba(0, 0, 0, 0.15)",
        };
    }
  };

  return (
    <div
      style={{
        marginBottom: 120,
        padding: 40,
        backgroundColor: "#fff",
        borderRadius: 24,
        boxShadow: "0 12px 40px rgba(0,0,0,0.08)",
        maxWidth: 900,
        margin: "0 auto",
        textAlign: "center",
      }}
    >
      <Title level={2} style={{ color: "#e31837", marginBottom: 24 }}>
        💬 What Our Users Say
      </Title>

      <Slider {...sliderSettings}>
        {testimonials.map((item, index) => (
          <Card
            key={index}
            style={{
              borderRadius: 20,
              padding: "30px",
              ...getCardStyle("dark"),
            }}
          >
            <Paragraph
              style={{ fontSize: 18, color: "#000", fontStyle: "italic" }}
            >
              “{item.comment}”
            </Paragraph>
            <Paragraph style={{ fontWeight: 600, color: "#e31837" }}>
              — {item.name}
            </Paragraph>
          </Card>
        ))}
      </Slider>
    </div>
  );
};

export default TestimonialSlider;
