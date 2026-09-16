import React, { useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Flex,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Segmented,
  Select,
  Space,
  Table,
  Tag,
  Tabs,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import useApiRequest from "../../hooks/useApiRequest";
import { Role } from "../../data/role";
import { checkRole } from "../../utils/roleUtils";
import { formatDateTime } from "../../utils/dateUtils";
import ExtraTimeResult from "../../components/ExtraTimeResult";
import {
  ALL_SHIFTS,
  EXTRA_TIME_MODULES,
  MAX_MINUTES,
  MAX_REASON_LENGTH,
  MIN_MINUTES,
  QUICK_MINUTES,
  TEST_SHIFTS,
  TIME_TYPE,
  HISTORY_URL,
  grantModuleTimeForGroup,
  grantOverallTimeForGroup,
  groupHistoryByBatch,
  parseApiError,
  useShiftLabel,
  useTimeTypeLabel,
} from "../../utils/extraTime";
import { useT } from "../../i18n/useT";

const { Title, Text } = Typography;
const { TextArea } = Input;

const DEFAULT_MINUTES = 15;

/** Pseudo-value for the history filter: send no `type` at all. */
const ALL_TYPES = "all";

const moduleOptions = EXTRA_TIME_MODULES.map((value) => ({
  value,
  label: value.charAt(0).toUpperCase() + value.slice(1),
}));

/** t() has no interpolation, so counts are filled in at the call site. */
const fill = (text, count) => String(text).replace("{n}", count);

/* ── Grant panel ─────────────────────────────────────────────────────────── */

const GrantPanel = ({ isAdmin, branches, branchLoading, testTimes, onGranted }) => {
  const t = useT();
  const shiftLabel = useShiftLabel();
  const timeTypeLabel = useTimeTypeLabel();
  const { user } = useSelector((state) => state.auth);

  // Only a full admin may move the whole sitting; a branch admin is never shown
  // the choice rather than shown it and refused with a 403.
  const [timeType, setTimeType] = useState(TIME_TYPE.MODULE);
  const isOverall = isAdmin && timeType === TIME_TYPE.OVERALL;

  // A branch admin never chooses: the backend would refuse another branch
  // anyway, so the field is fixed rather than shown and rejected.
  const [selectedBranch, setSelectedBranch] = useState();
  const branchId = isAdmin ? selectedBranch : user?.branchId;

  const [date, setDate] = useState(dayjs());
  const [shift, setShift] = useState(ALL_SHIFTS);
  const [module, setModule] = useState(EXTRA_TIME_MODULES[0]);
  const [minutes, setMinutes] = useState(DEFAULT_MINUTES);
  const [reason, setReason] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState(null);
  const [result, setResult] = useState(null);

  const branchName = useMemo(
    () => branches.find((branch) => branch.id === branchId)?.name,
    [branches, branchId]
  );

  const minutesValid =
    Number.isInteger(minutes) &&
    minutes >= MIN_MINUTES &&
    minutes <= MAX_MINUTES;
  const canSubmit = Boolean(branchId) && minutesValid;

  const addMinutes = (amount) =>
    setMinutes((current) =>
      Math.min(MAX_MINUTES, (Number.isFinite(current) ? current : 0) + amount)
    );

  const handleConfirm = async () => {
    // Guarded as well as disabled: a double click must not become two grants.
    if (submitting || !canSubmit) return;

    setSubmitting(true);
    setFieldErrors(null);

    try {
      const send = isOverall ? grantOverallTimeForGroup : grantModuleTimeForGroup;

      const data = await send({
        branch_id: branchId,
        date: date.format("YYYY-MM-DD"),
        test_time: shift === ALL_SHIFTS ? undefined : shift,
        // The overall endpoint takes no module: it moves the whole sitting.
        ...(isOverall ? {} : { module }),
        minutes,
        reason: reason.trim() || undefined,
      });

      setResult(data);
      setConfirmOpen(false);
      onGranted?.();
    } catch (error) {
      const { status, fields, message } = parseApiError(error);

      setConfirmOpen(false);

      if (fields) {
        setFieldErrors(fields);
        return;
      }

      if (status === 403) toast.error(t("extraTime.noPermission"));
      else if (status === 404) toast.error(t("extraTime.notFound"));
      else toast.error(message || t("extraTime.failed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={13}>
          <Card title={t("extraTime.groupTitle")} variant="borderless">
            <Text type="secondary">
              {isOverall ? t("extraTime.overallHint") : t("extraTime.groupHint")}
            </Text>

            <Form layout="vertical" style={{ marginTop: 16 }}>
              {isAdmin && (
                <Form.Item label={t("extraTime.level")}>
                  <Segmented
                    block
                    value={timeType}
                    onChange={setTimeType}
                    options={[
                      {
                        value: TIME_TYPE.MODULE,
                        label: timeTypeLabel(TIME_TYPE.MODULE),
                      },
                      {
                        value: TIME_TYPE.OVERALL,
                        label: timeTypeLabel(TIME_TYPE.OVERALL),
                      },
                    ]}
                  />
                </Form.Item>
              )}

              <Form.Item
                label={t("extraTime.branch")}
                required={isAdmin}
                validateStatus={fieldErrors?.branch_id ? "error" : undefined}
                help={fieldErrors?.branch_id}
              >
                {isAdmin ? (
                  <Select
                    placeholder={t("extraTime.selectBranch")}
                    value={selectedBranch}
                    loading={branchLoading}
                    onChange={setSelectedBranch}
                    showSearch
                    optionFilterProp="label"
                    options={branches.map((branch) => ({
                      value: branch.id,
                      label: branch.name,
                    }))}
                  />
                ) : (
                  <Input
                    readOnly
                    value={branchName || t("extraTime.yourBranch")}
                  />
                )}
              </Form.Item>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label={t("extraTime.date")}
                    validateStatus={fieldErrors?.date ? "error" : undefined}
                    help={fieldErrors?.date}
                  >
                    <DatePicker
                      style={{ width: "100%" }}
                      value={date}
                      allowClear={false}
                      onChange={(value) => setDate(value || dayjs())}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label={t("extraTime.shift")}
                    validateStatus={fieldErrors?.test_time ? "error" : undefined}
                    help={fieldErrors?.test_time}
                  >
                    <Select
                      value={shift}
                      onChange={setShift}
                      options={[ALL_SHIFTS, ...testTimes].map((value) => ({
                        value,
                        label: shiftLabel(value),
                      }))}
                    />
                  </Form.Item>
                </Col>
              </Row>

              {/* Overall time belongs to the sitting, not to any one module. */}
              {!isOverall && (
                <Form.Item
                  label={t("extraTime.module")}
                  validateStatus={fieldErrors?.module ? "error" : undefined}
                  help={fieldErrors?.module}
                >
                  <Segmented
                    block
                    value={module}
                    options={moduleOptions}
                    onChange={setModule}
                  />
                </Form.Item>
              )}

              <Form.Item
                label={t("extraTime.minutes")}
                validateStatus={
                  fieldErrors?.minutes || !minutesValid ? "error" : undefined
                }
                help={
                  fieldErrors?.minutes ||
                  (minutesValid
                    ? t("extraTime.minutesHint")
                    : t("extraTime.minutesRequired"))
                }
              >
                <Flex gap={8} wrap="wrap">
                  <InputNumber
                    min={MIN_MINUTES}
                    max={MAX_MINUTES}
                    precision={0}
                    value={minutes}
                    onChange={setMinutes}
                    style={{ width: 110 }}
                  />
                  {QUICK_MINUTES.map((amount) => (
                    <Button key={amount} onClick={() => addMinutes(amount)}>
                      +{amount}
                    </Button>
                  ))}
                </Flex>
              </Form.Item>

              <Form.Item
                label={t("extraTime.reason")}
                validateStatus={fieldErrors?.reason ? "error" : undefined}
                help={fieldErrors?.reason}
              >
                <TextArea
                  rows={3}
                  value={reason}
                  maxLength={MAX_REASON_LENGTH}
                  showCount
                  placeholder={t("extraTime.reasonPlaceholder")}
                  onChange={(event) => setReason(event.target.value)}
                />
              </Form.Item>

              {isOverall && (
                <Alert
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                  message={t("extraTime.overallReopenNote")}
                />
              )}

              {!reason.trim() && (
                <Alert
                  type="warning"
                  showIcon
                  style={{ marginBottom: 16 }}
                  message={t("extraTime.reasonWarning")}
                />
              )}

              <Button
                type="primary"
                size="large"
                block
                loading={submitting}
                disabled={!canSubmit}
                onClick={() => setConfirmOpen(true)}
              >
                {t("extraTime.submit")}
              </Button>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={11}>
          <ExtraTimeResult result={result} />
        </Col>
      </Row>

      <Modal
        open={confirmOpen}
        title={t("extraTime.confirmTitle")}
        okText={t("extraTime.confirmYes")}
        cancelText={t("common.cancel")}
        confirmLoading={submitting}
        maskClosable={!submitting}
        onCancel={() => setConfirmOpen(false)}
        onOk={handleConfirm}
      >
        <Space direction="vertical" size={4}>
          <Text>
            {[
              branchName || t("extraTime.yourBranch"),
              date.format("DD.MM.YYYY"),
              shiftLabel(shift),
              isOverall
                ? timeTypeLabel(TIME_TYPE.OVERALL)
                : moduleOptions.find((option) => option.value === module)?.label,
            ].join("  /  ")}
          </Text>
          <Text strong style={{ fontSize: 16 }}>
            + {minutes} {t("extraTime.minutes").toLowerCase()}
          </Text>
          {reason.trim() && <Text type="secondary">{reason.trim()}</Text>}
        </Space>
      </Modal>
    </>
  );
};

/* ── History panel ───────────────────────────────────────────────────────── */

const HistoryPanel = ({ isAdmin, branches, refreshKey }) => {
  const t = useT();
  const shiftLabel = useShiftLabel();
  const timeTypeLabel = useTimeTypeLabel();

  const [typeFilter, setTypeFilter] = useState(ALL_TYPES);
  const [branchFilter, setBranchFilter] = useState();
  const [dateFilter, setDateFilter] = useState(dayjs());
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);

  const url = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", page);
    params.set("size", size);
    // Branch admins get their own branch whatever is sent, so nothing is sent.
    if (isAdmin && branchFilter) params.set("branchId", branchFilter);
    if (dateFilter) params.set("date", dateFilter.format("YYYY-MM-DD"));
    // Anything other than "module" or "exam" is a 400, so "all" means omit it.
    if (typeFilter !== ALL_TYPES) params.set("type", typeFilter);
    return `${HISTORY_URL}?${params.toString()}`;
  }, [isAdmin, branchFilter, dateFilter, typeFilter, page, size]);

  const { data, loading } = useApiRequest(url, [url, refreshKey]);

  const payload = data?.data;
  const groups = useMemo(
    () => groupHistoryByBatch(payload?.data),
    [payload?.data]
  );

  const columns = [
    {
      title: t("extraTime.level"),
      key: "type",
      width: 120,
      render: (_, group) => {
        const rowType =
          group.first.type === TIME_TYPE.OVERALL
            ? TIME_TYPE.OVERALL
            : TIME_TYPE.MODULE;

        return (
          <Tag color={rowType === TIME_TYPE.OVERALL ? "purple" : "blue"}>
            {timeTypeLabel(rowType)}
          </Tag>
        );
      },
    },
    {
      title: t("extraTime.date"),
      key: "date",
      width: 120,
      render: (_, group) => group.first.date,
    },
    {
      title: t("extraTime.shift"),
      key: "shift",
      width: 130,
      render: (_, group) => <Tag color="blue">{shiftLabel(group.first.test_time)}</Tag>,
    },
    {
      title: t("extraTime.student"),
      key: "student",
      render: (_, group) =>
        group.rows.length > 1 ? (
          <Tag color="purple">
            {t("extraTime.batchTag")} ·{" "}
            {fill(t("extraTime.studentsCount"), group.rows.length)}
          </Tag>
        ) : (
          group.first.student_name
        ),
    },
    {
      title: t("extraTime.module"),
      key: "module",
      width: 120,
      render: (_, group) => {
        // Overall grants carry no module; an empty cell would read as missing
        // data rather than as "does not apply".
        const value = group.first.module;
        if (!value) return <Text type="secondary">{t("extraTime.notApplicable")}</Text>;

        return value.charAt(0).toUpperCase() + value.slice(1);
      },
    },
    {
      title: t("extraTime.minutes"),
      key: "minutes",
      width: 100,
      render: (_, group) => <Tag color="green">+{group.first.minutes}</Tag>,
    },
    {
      title: t("extraTime.grantedBy"),
      key: "grantedBy",
      render: (_, group) => group.first.granted_by_name || "-",
    },
    {
      title: t("extraTime.reasonCol"),
      key: "reason",
      render: (_, group) => group.first.reason || "-",
    },
    {
      title: t("extraTime.createdAt"),
      key: "createdAt",
      width: 170,
      render: (_, group) => formatDateTime(group.first.created_at),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }} wrap>
        <Segmented
          value={typeFilter}
          onChange={(value) => {
            setTypeFilter(value);
            setPage(0);
          }}
          options={[
            { value: ALL_TYPES, label: t("common.all") },
            { value: TIME_TYPE.MODULE, label: timeTypeLabel(TIME_TYPE.MODULE) },
            { value: TIME_TYPE.OVERALL, label: timeTypeLabel(TIME_TYPE.OVERALL) },
          ]}
        />

        {isAdmin && (
          <Select
            allowClear
            placeholder={t("extraTime.selectBranch")}
            style={{ width: 260 }}
            value={branchFilter}
            onChange={(value) => {
              setBranchFilter(value);
              setPage(0);
            }}
            options={branches.map((branch) => ({
              value: branch.id,
              label: branch.name,
            }))}
          />
        )}
        <DatePicker
          value={dateFilter}
          onChange={(value) => {
            setDateFilter(value);
            setPage(0);
          }}
        />
      </Space>

      <Table
        rowKey="key"
        loading={loading}
        columns={columns}
        dataSource={groups}
        locale={{ emptyText: t("extraTime.noHistory") }}
        // A batch is opened to see who it actually reached.
        expandable={{
          rowExpandable: (group) => group.rows.length > 1,
          expandedRowRender: (group) => (
            <Table
              size="small"
              rowKey="id"
              dataSource={group.rows}
              pagination={false}
              columns={[
                {
                  title: t("extraTime.student"),
                  dataIndex: "student_name",
                  key: "student_name",
                },
                {
                  title: t("extraTime.minutes"),
                  dataIndex: "minutes",
                  key: "minutes",
                  width: 100,
                  render: (value) => <Tag color="green">+{value}</Tag>,
                },
              ]}
            />
          ),
        }}
        pagination={{
          current: (payload?.currentPage ?? page) + 1,
          pageSize: payload?.currentSize ?? size,
          total: payload?.totalSizes ?? 0,
          showSizeChanger: true,
          onChange: (nextPage, nextSize) => {
            setPage(nextPage - 1);
            setSize(nextSize);
          },
        }}
      />
    </div>
  );
};

/* ── Page ────────────────────────────────────────────────────────────────── */

const ExtraTime = () => {
  const t = useT();
  const { user } = useSelector((state) => state.auth);
  const isAdmin = checkRole(user?.roles || [], Role.ROLE_ADMIN);

  const [historyRefresh, setHistoryRefresh] = useState(0);

  const { data: branchData, loading: branchLoading } =
    useApiRequest("api/v1/branch/all");

  const branches = branchData?.data?.branches || [];
  const testTimes = branchData?.data?.testTimes?.length
    ? branchData.data.testTimes
    : TEST_SHIFTS;

  return (
    <div>
      <Title level={3} style={{ marginBottom: 4 }}>
        ⏱️ {t("extraTime.title")}
      </Title>
      <Text type="secondary">{t("extraTime.subtitle")}</Text>

      <Tabs
        style={{ marginTop: 16 }}
        items={[
          {
            key: "grant",
            label: t("extraTime.grantTab"),
            children: (
              <GrantPanel
                isAdmin={isAdmin}
                branches={branches}
                branchLoading={branchLoading}
                testTimes={testTimes}
                onGranted={() => setHistoryRefresh((value) => value + 1)}
              />
            ),
          },
          {
            key: "history",
            label: t("extraTime.historyTab"),
            children: (
              <HistoryPanel
                isAdmin={isAdmin}
                branches={branches}
                refreshKey={historyRefresh}
              />
            ),
          },
        ]}
      />
    </div>
  );
};

export default ExtraTime;
