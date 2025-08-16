import { Button, Card, Space, theme, Typography } from "antd";
import { Link } from "react-router-dom";
import { EyeOutlined } from "@ant-design/icons";

const { Text } = Typography;

const ScoreBox = ({
  id,
  icon,
  label,
  score,
  userId,
  booking = false,
  isBeforeDate = false,
}) => {
  const { token } = theme.useToken();

  return (
    <>
      <Card
        size="small"
        style={{
          minWidth: 120,
          textAlign: "center",
          backgroundColor:
            !isBeforeDate && booking
              ? token.colorErrorBg
              : token.colorPrimaryBg,
          border: `1px solid ${
            !isBeforeDate && booking ? token.colorError : token.colorPrimary
          }`,
          borderRadius: "8px",
        }}
      >
        <Space direction="vertical">
          {icon}
          <Text strong>{label}</Text>
          <Text>{score ?? "0.0"} score</Text>
          {booking ? (
            <div></div>
          ) : label === "Speaking" ? (
            <div
              style={{
                background: token.colorPrimaryBg,
                height: "30px",
                width: "100%",
              }}
            />
          ) : (
            <Link
              to={
                label === "Writing"
                  ? `/dashboard/history/${userId}/${label.toLowerCase()}/${id}`
                  : `/dashboard/history/${id}/${label.toLowerCase()}`
              }
            >
              <Button type="dashed" icon={<EyeOutlined />} />
            </Link>
          )}
        </Space>
      </Card>
    </>
  );
};

export default ScoreBox;
