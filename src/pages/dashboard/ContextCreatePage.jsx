import { Card, DatePicker, Select, Typography, Button } from "antd";
import { CalendarOutlined, AudioOutlined, BookOutlined } from "@ant-design/icons";
import { Flex } from "antd";

const { Title } = Typography;
const { Option } = Select;

const ContextCreatePage = () => {
  return (
    <div className="w-full min-h-screen bg-[#f9f9f9] py-10 px-4 flex justify-center">
      <div className="w-full max-w-[700px] space-y-6">
        <Title level={2} className="text-center">
          Yangi Test Context Yaratish
        </Title>

        <Card
          title={<span className="font-semibold text-lg">🗓️ 1-qadam: Test sanasini tanlash</span>}
          bordered={false}
          className="shadow-md"
        >
          <DatePicker
            className="w-full"
            size="large"
            suffixIcon={<CalendarOutlined />}
          />
        </Card>

        <Card
          title={<span className="font-semibold text-lg">💡 2-qadam: Listening (Part 1-4)</span>}
          bordered={false}
          className="shadow-md"
        >
          <Flex vertical gap={10}>
            {[1, 2, 3, 4].map((num) => (
              <Select
                key={num}
                placeholder={`Listening PART_${num}`}
                className="w-full"
                size="large"
                suffixIcon={<AudioOutlined />}
              >
                <Option value={`listening_part_${num}_1`}>Option 1</Option>
                <Option value={`listening_part_${num}_2`}>Option 2</Option>
              </Select>
            ))}
          </Flex>
        </Card>

        {/* Step 3: Reading */}
        <Card
          title={<span className="font-semibold text-lg">📖 3-qadam: Reading (Easy, Medium, Hard)</span>}
          bordered={false}
          className="shadow-md"
        >
          <Flex vertical gap={10}>
            {["easy", "medium", "hard"].map((level) => (
              <Select
                key={level}
                placeholder={`Reading (${level})`}
                className="w-full"
                size="large"
                suffixIcon={<BookOutlined />}
              >
                <Option value={`reading_${level}_1`}>Option 1</Option>
                <Option value={`reading_${level}_2`}>Option 2</Option>
              </Select>
            ))}
          </Flex>
        </Card>

        {/* Step 4: Writing */}
        <Card
          title={<span className="font-semibold text-lg">✍️ 4-qadam: Writing Task 1 & 2</span>}
          bordered={false}
          className="shadow-md"
        >
          <Flex vertical gap={10}>
            {[1, 2].map((task) => (
              <Select
                key={task}
                placeholder={`Writing Task ${task}`}
                className="w-full"
                size="large"
              >
                <Option value={`writing_task_${task}_1`}>Option 1</Option>
                <Option value={`writing_task_${task}_2`}>Option 2</Option>
              </Select>
            ))}
          </Flex>
        </Card>

        <div className="text-center pt-4">
          <Button type="primary" size="large">
            Submit Context
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ContextCreatePage;
