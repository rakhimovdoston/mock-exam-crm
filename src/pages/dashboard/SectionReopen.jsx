import React, { useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  DatePicker,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import useApiRequest from "../../hooks/useApiRequest";
import { Role } from "../../data/role";
import { checkRole } from "../../utils/roleUtils";
import { formatDateTime } from "../../utils/dateUtils";
import SectionReopenResult from "../../components/SectionReopenResult";
import {
  ALL_SHIFTS,
  MAX_REASON_LENGTH,
  REOPEN_HISTORY_URL,
  REOPEN_MODULES,
  REOPEN_STATUS,
  TEST_SHIFTS,
  cancelReopen,
  groupHistoryByBatch,
  moduleLabel,
  parseApiError,
  reopenForGroup,
  sortModules,
  useReopenStatus,
  useShiftLabel,
} from "../../utils/sectionReopen";
import { useT } from "../../i18n/useT";

const { Title, Text } = Typography;
const { TextArea } = Input;

const moduleOptions = REOPEN_MODULES.map((value) => ({
  value,
  label: moduleLabel(value),
}));

/** t() has no interpolation, so counts are filled in at the call site. */
const fill = (text, count) => String(text).replace("{n}", count);

/* ── Reopen panel ────────────────────────────────────────────────────────── */

const ReopenPanel = ({ isAdmin, branches, branchLoading, testTimes, onReopened }) => {
  const t = useT();
  const shiftLabel = useShiftLabel();
  const { user } = useSelector((state) => state.auth);

  // A branch admin never chooses: the backend would refuse another branch
  // anyway, so the field is fixed rather than shown and rejected.
  const [selectedBranch, setSelectedBranch] = useState();
  const branchId = isAdmin ? selectedBranch : user?.branchId;

  const [date, setDate] = useState(dayjs());
  const [shift, setShift] = useState(ALL_SHIFTS);
  const [modules, setModules] = useState([]);
  const [reason, setReason] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState(null);
  const [result, setResult] = useState(null);

  const branchName = useMemo(
    () => branches.find((branch) => branch.id === branchId)?.name,
    [branches, branchId]
  );

  const canSubmit = Boolean(branchId) && modules.length > 0;

  const handleConfirm = async () => {
    // Guarded as well as disabled: a double click must not become two reopens.
    if (submitting || !canSubmit) return;

    setSubmitting(true);
    setFieldErrors(null);

    try {
      const data = await reopenForGroup({
        branch_id: branchId,
        date: date.format("YYYY-MM-DD"),
        test_time: shift === ALL_SHIFTS ? undefined : shift,
        modules: sortModules(modules),
        reason: reason.trim() || undefined,
      });

      setResult(data);
      setConfirmOpen(false);
      onReopened?.();
    } catch (error) {
      const { status, fields, message } = parseApiError(error);

      setConfirmOpen(false);

      if (fields) {
        setFieldErrors(fields);
        return;
      }

      if (status === 403) toast.error(t("sectionReopen.noPermission"));
      else if (status === 404) toast.error(t("sectionReopen.notFound"));
      else toast.error(message || t("sectionReopen.failed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={13}>
          <Card title={t("sectionReopen.groupTitle")} variant="borderless">
            <Text type="secondary">{t("sectionReopen.groupHint")}</Text>

            <Form layout="vertical" style={{ marginTop: 16 }}>
              <Form.Item
                label={t("sectionReopen.branch")}
                required={isAdmin}
                validateStatus={fieldErrors?.branch_id ? "error" : undefined}
                help={fieldErrors?.branch_id}
              >
                {isAdmin ? (
                  <Select
                    placeholder={t("sectionReopen.selectBranch")}
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
                    value={branchName || t("sectionReopen.yourBranch")}
                  />
                )}
              </Form.Item>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label={t("sectionReopen.date")}
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
                    label={t("sectionReopen.shift")}
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

              {/* Several modules can fail in one sitting — a broken audio and a
                  lost essay are one incident, so they are one action. */}
              <Form.Item
                label={t("sectionReopen.modules")}
                required
                validateStatus={
                  fieldErrors?.modules || modules.length === 0
                    ? "error"
                    : undefined
                }
                help={
                  fieldErrors?.modules ||
                  (modules.length === 0
                    ? t("sectionReopen.modulesRequired")
                    : t("sectionReopen.modulesHint"))
                }
              >
                <Checkbox.Group
                  options={moduleOptions}
                  value={modules}
                  onChange={setModules}
                />
              </Form.Item>

              <Form.Item
                label={t("sectionReopen.reason")}
                validateStatus={fieldErrors?.reason ? "error" : undefined}
                help={fieldErrors?.reason}
              >
                <TextArea
                  rows={3}
                  value={reason}
                  maxLength={MAX_REASON_LENGTH}
                  showCount
                  placeholder={t("sectionReopen.reasonPlaceholder")}
                  onChange={(event) => setReason(event.target.value)}
                />
              </Form.Item>

              <Alert
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
                message={t("sectionReopen.destructiveTitle")}
                description={t("sectionReopen.destructiveBody")}
              />

              {!reason.trim() && (
                <Alert
                  type="warning"
                  showIcon
                  style={{ marginBottom: 16 }}
                  message={t("sectionReopen.reasonWarning")}
                />
              )}

              <Button
                type="primary"
                danger
                size="large"
                block
                loading={submitting}
                disabled={!canSubmit}
                onClick={() => setConfirmOpen(true)}
              >
                {t("sectionReopen.submit")}
              </Button>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={11}>
          <SectionReopenResult result={result} />
        </Col>
      </Row>

      <Modal
        open={confirmOpen}
        title={t("sectionReopen.confirmTitle")}
        okText={t("sectionReopen.confirmYes")}
        okButtonProps={{ danger: true }}
        cancelText={t("common.cancel")}
        confirmLoading={submitting}
        maskClosable={!submitting}
        onCancel={() => setConfirmOpen(false)}
        onOk={handleConfirm}
      >
        <Space direction="vertical" size={8}>
          <Text>
            {[
              branchName || t("sectionReopen.yourBranch"),
              date.format("DD.MM.YYYY"),
              shiftLabel(shift),
            ].join("  /  ")}
          </Text>
          <Space size={6} wrap>
            {sortModules(modules).map((module) => (
              <Tag key={module} color="volcano">
                {moduleLabel(module)}
              </Tag>
            ))}
          </Space>
          <Text type="danger">{t("sectionReopen.destructiveBody")}</Text>
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
  const reopenStatus = useReopenStatus();

  const [branchFilter, setBranchFilter] = useState();
  const [dateFilter, setDateFilter] = useState(dayjs());
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);

  // The row being cancelled, and a local bump so the table re-reads afterwards.
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [localRefresh, setLocalRefresh] = useState(0);

  const url = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", page);
    params.set("size", size);
    // Branch admins get their own branch whatever is sent, so nothing is sent.
    if (isAdmin && branchFilter) params.set("branchId", branchFilter);
    if (dateFilter) params.set("date", dateFilter.format("YYYY-MM-DD"));
    return `${REOPEN_HISTORY_URL}?${params.toString()}`;
  }, [isAdmin, branchFilter, dateFilter, page, size]);

  const { data, loading } = useApiRequest(url, [url, refreshKey, localRefresh]);

  const payload = data?.data;
  const groups = useMemo(
    () => groupHistoryByBatch(payload?.data),
    [payload?.data]
  );

  const handleCancel = async () => {
    if (!cancelTarget || cancelling) return;

    setCancelling(true);

    try {
      await cancelReopen(cancelTarget.id);
      toast.success(t("sectionReopen.cancelled"));
      setCancelTarget(null);
      setLocalRefresh((value) => value + 1);
    } catch (error) {
      const { message } = parseApiError(error);
      toast.error(message || t("sectionReopen.cancelFailed"));
    } finally {
      setCancelling(false);
    }
  };

  const statusTag = (row) => {
    const { color, label } = reopenStatus(row.status);
    return <Tag color={color}>{label}</Tag>;
  };

  const cancelButton = (row) =>
    row.status === REOPEN_STATUS.OPEN ? (
      <Button size="small" danger onClick={() => setCancelTarget(row)}>
        {t("sectionReopen.cancel")}
      </Button>
    ) : null;

  /**
   * One student with two modules reopened is two rows sharing a batch id, the
   * same shape a whole session produces. Distinct students, not row count, is
   * what makes a group a group.
   */
  const studentsIn = (group) =>
    new Set(group.rows.map((row) => row.student_id ?? row.student_name)).size;

  const columns = [
    {
      title: t("sectionReopen.date"),
      key: "date",
      width: 110,
      render: (_, group) => group.first.date,
    },
    {
      title: t("sectionReopen.shift"),
      key: "shift",
      width: 120,
      render: (_, group) => <Tag color="blue">{shiftLabel(group.first.test_time)}</Tag>,
    },
    {
      title: t("sectionReopen.student"),
      key: "student",
      render: (_, group) =>
        studentsIn(group) > 1 ? (
          <Tag color="purple">
            {t("sectionReopen.batchTag")} ·{" "}
            {fill(t("sectionReopen.studentsCount"), studentsIn(group))}
          </Tag>
        ) : (
          group.first.student_name
        ),
    },
    {
      title: t("sectionReopen.module"),
      key: "module",
      width: 130,
      render: (_, group) =>
        group.rows.length > 1 ? (
          <Space size={4} wrap>
            {sortModules([
              ...new Set(group.rows.map((row) => row.module)),
            ]).map((module) => (
              <Tag key={module} style={{ marginInlineEnd: 0 }}>
                {moduleLabel(module)}
              </Tag>
            ))}
          </Space>
        ) : (
          moduleLabel(group.first.module)
        ),
    },
    {
      title: t("common.status"),
      key: "status",
      width: 130,
      render: (_, group) => {
        if (group.rows.length === 1) return statusTag(group.first);

        // A batch can be part done, part cancelled, part still waiting. One tag
        // per distinct status with its count says that; the first row's status
        // would speak for students it knows nothing about.
        const counts = group.rows.reduce((acc, row) => {
          acc[row.status] = (acc[row.status] || 0) + 1;
          return acc;
        }, {});

        return (
          <Space size={4} wrap>
            {Object.entries(counts).map(([status, count]) => {
              const { color, label } = reopenStatus(status);
              return (
                <Tag key={status} color={color} style={{ marginInlineEnd: 0 }}>
                  {label} · {count}
                </Tag>
              );
            })}
          </Space>
        );
      },
    },
    {
      title: t("sectionReopen.previousScore"),
      key: "previousScore",
      width: 120,
      render: (_, group) =>
        group.rows.length > 1 ? (
          <Text type="secondary">—</Text>
        ) : group.first.previous_score != null &&
          group.first.previous_score !== "" ? (
          <Tag color="blue">{group.first.previous_score}</Tag>
        ) : (
          <Text type="secondary">{t("sectionReopen.noScore")}</Text>
        ),
    },
    {
      title: t("sectionReopen.reopenedBy"),
      key: "reopenedBy",
      render: (_, group) => group.first.reopened_by_name || "-",
    },
    {
      title: t("sectionReopen.reasonCol"),
      key: "reason",
      render: (_, group) => group.first.reason || "-",
    },
    {
      title: t("sectionReopen.createdAt"),
      key: "createdAt",
      width: 170,
      render: (_, group) => formatDateTime(group.first.created_at),
    },
    {
      title: "",
      key: "actions",
      width: 120,
      // A batch is cancelled one student at a time, from the expanded rows:
      // the usual reason to cancel is that one student was included by
      // mistake, not that the whole session was.
      render: (_, group) =>
        group.rows.length === 1 ? cancelButton(group.first) : null,
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }} wrap>
        {isAdmin && (
          <Select
            allowClear
            placeholder={t("sectionReopen.selectBranch")}
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
        scroll={{ x: 1200 }}
        locale={{ emptyText: t("sectionReopen.noHistory") }}
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
                  title: t("sectionReopen.student"),
                  dataIndex: "student_name",
                  key: "student_name",
                },
                {
                  title: t("sectionReopen.module"),
                  key: "module",
                  width: 120,
                  render: (_, row) => moduleLabel(row.module),
                },
                {
                  title: t("common.status"),
                  key: "status",
                  width: 130,
                  render: (_, row) => statusTag(row),
                },
                {
                  title: t("sectionReopen.previousScore"),
                  key: "previous_score",
                  width: 120,
                  render: (_, row) =>
                    row.previous_score != null && row.previous_score !== "" ? (
                      <Tag color="blue">{row.previous_score}</Tag>
                    ) : (
                      <Text type="secondary">{t("sectionReopen.noScore")}</Text>
                    ),
                },
                {
                  title: "",
                  key: "actions",
                  width: 120,
                  render: (_, row) => cancelButton(row),
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
          // The endpoint refuses anything above 100 with a 400.
          pageSizeOptions: [10, 20, 50, 100],
          onChange: (nextPage, nextSize) => {
            setPage(nextPage - 1);
            setSize(nextSize);
          },
        }}
      />

      <Modal
        open={Boolean(cancelTarget)}
        title={t("sectionReopen.cancelTitle")}
        okText={t("sectionReopen.cancelYes")}
        okButtonProps={{ danger: true }}
        cancelText={t("common.cancel")}
        confirmLoading={cancelling}
        maskClosable={!cancelling}
        onCancel={() => setCancelTarget(null)}
        onOk={handleCancel}
      >
        <Space direction="vertical" size={8}>
          <Text>
            {[
              cancelTarget?.student_name,
              moduleLabel(cancelTarget?.module),
              cancelTarget?.date,
            ]
              .filter(Boolean)
              .join("  /  ")}
          </Text>
          {/* The single thing an admin must understand before agreeing. */}
          <Text type="danger">{t("sectionReopen.cancelWarning")}</Text>
        </Space>
      </Modal>
    </div>
  );
};

/* ── Page ────────────────────────────────────────────────────────────────── */

const SectionReopen = () => {
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
        🔄 {t("sectionReopen.title")}
      </Title>
      <Text type="secondary">{t("sectionReopen.subtitle")}</Text>

      <Tabs
        style={{ marginTop: 16 }}
        items={[
          {
            key: "reopen",
            label: t("sectionReopen.reopenTab"),
            children: (
              <ReopenPanel
                isAdmin={isAdmin}
                branches={branches}
                branchLoading={branchLoading}
                testTimes={testTimes}
                onReopened={() => setHistoryRefresh((value) => value + 1)}
              />
            ),
          },
          {
            key: "history",
            label: t("sectionReopen.historyTab"),
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

export default SectionReopen;
