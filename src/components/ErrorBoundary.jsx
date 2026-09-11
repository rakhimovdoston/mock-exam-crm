import React from "react";
import { Button, Result } from "antd";

// Catches render/runtime errors in the subtree so a single crash
// does not blank the whole screen (white screen of death).
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Surface the real error for debugging instead of a silent white screen.
    console.error("ErrorBoundary caught:", error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Result
            status="error"
            title="Something went wrong"
            subTitle={
              this.state.error?.message ||
              "An unexpected error occurred on this page."
            }
            extra={[
              <Button type="primary" key="reload" onClick={this.handleReload}>
                Reload page
              </Button>,
            ]}
          />
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
