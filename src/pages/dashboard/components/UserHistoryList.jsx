import React from "react";
import { List, Spin } from "antd";

import HistoryItemCard from "./HistoryItemCard";

const UserHistoryList = ({
  history,
  loading,
  token,
  userId,
  userEmail,
  onRefresh,
}) => {
  if (loading) {
    return <Spin />;
  }

  return (
    <List
      grid={{ gutter: 24, column: 1 }}
      dataSource={history}
      locale={{ emptyText: "No booking history" }}
      renderItem={(item) => (
        <List.Item>
          <HistoryItemCard
            item={item}
            token={token}
            userId={userId}
            userEmail={userEmail}
            onRefresh={onRefresh}
          />
        </List.Item>
      )}
    />
  );
};

export default UserHistoryList;
