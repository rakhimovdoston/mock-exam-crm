import React, { useMemo } from "react";
import {
  Alert,
  Button,
  Col,
  DatePicker,
  Divider,
  Row,
  Segmented,
  Select,
  Space,
  Switch,
  Tooltip,
  Typography,
} from "antd";
import { ExperimentOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import dayjs from "dayjs";

import usePolledRequest from "../../hooks/usePolledRequest";
import useDashboardFilters, {
  SCORE_RANGES,
  TREND_RANGES,
} from "./useDashboardFilters";
import SpeakingTodayPanel from "./panels/SpeakingTodayPanel";
import AttentionPanel from "./panels/AttentionPanel";
import ScoresPanel from "./panels/ScoresPanel";
import TrendPanel from "./panels/TrendPanel";
import BreakdownPanel from "./panels/BreakdownPanel";
import CapacityPanel from "./panels/CapacityPanel";
import ArchivePanel from "./panels/ArchivePanel";
import { StaleBadge } from "./components/PanelState";
import {
  DEMO_ARCHIVE,
  DEMO_ATTENTION,
  DEMO_BRANCH_BOOKINGS,
  DEMO_CAPACITY,
  DEMO_SCORES,
  DEMO_TREND,
} from "./demoData";
import { Role } from "../../data/role";
import { checkRole } from "../../utils/roleUtils";
import { useT } from "../../i18n/useT";

const { Title, Text } = Typography;

/** Today and the action queue go stale fast; nothing else does. */
const LIVE_REFRESH_MS = 60000;

const withBranch = (base, branchId) =>
  branchId ? `${base}${base.includes("?") ? "&" : "?"}branchId=${branchId}` : base;

/**
 * Either the live request or the invented stand-in, in one shape.
 *
 * In example mode nothing is requested at all — the urls are withheld from the
 * hooks — so there is no half-real page where some panels show the centre's
 * figures and others show made-up ones.
 */
const resolve = (demo, demoValue, request) =>
  demo
    ? { data: demoValue, loading: false, error: null, stale: false, refetch: () => {} }
    : {
        data: request.data?.data,
        loading: request.loading,
        error: request.error,
        stale: request.stale,
        refetch: request.refetch,
      };

const Section = ({ title, hint, stale, extra, children }) => (
  <div>
    <Divider orientation="left" style={{ marginBlock: 4 }}>
      <Space size={8} wrap>
        <Text strong style={{ fontSize: 14 }}>
          {title}
        </Text>
        {hint && (
          <Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>
            {hint}
          </Text>
        )}
        {stale && <StaleBadge />}
      </Space>
    </Divider>
    {extra && <div style={{ marginBottom: 12 }}>{extra}</div>}
    {children}
  </div>
);

/* ── Speaker ───────────────────────────────────────────────────────────── */

/**
 * A speaker may read today and the action queue, and both come back narrowed
 * to their own sessions. Every other endpoint answers 403, so none is called.
 */
const SpeakerDashboard = ({ t }) => {
  const todayReq = usePolledRequest("api/v1/dashboard/today", LIVE_REFRESH_MS);
  const attentionReq = usePolledRequest("api/v1/dashboard/attention", LIVE_REFRESH_MS);

  // Same unwrapping as the staff view, so both read the envelope once.
  const today = resolve(false, null, todayReq);
  const attention = resolve(false, null, attentionReq);

  return (
    <Space direction="vertical" size={20} style={{ width: "100%" }}>
      <div>
        <Title level={3} style={{ margin: 0 }}>
          {t("dashboard.speakerTitle")}
        </Title>
        <Text type="secondary">{dayjs().format("DD.MM.YYYY")}</Text>
      </div>

      <Section title={t("dashboard.today")} stale={today.stale}>
        <SpeakingTodayPanel
          data={today.data}
          loading={today.loading}
          error={today.error}
          onRetry={today.refetch}
        />
      </Section>

      <Section title={t("dashboard.attention")} stale={attention.stale}>
        <AttentionPanel
          data={attention.data}
          loading={attention.loading}
          error={attention.error}
          onRetry={attention.refetch}
          visibleKeys={["speakingUnscored"]}
          example={DEMO_ATTENTION}
        />
      </Section>
    </Space>
  );
};

/* ── Admin and branch admin ────────────────────────────────────────────── */

const StaffDashboard = ({ t, isAdmin }) => {
  const { branchId, date, scoreDays, trendMonths, dateBy, demo, update } =
    useDashboardFilters();

  // A branch admin is pinned to their own branch by the backend; showing them
  // a picker that changes nothing would be worse than showing none.
  const branches = usePolledRequest(isAdmin ? "api/v1/branch/all" : null);
  const branchOptions = (branches.data?.data?.branches || []).map((branch) => ({
    value: branch.id,
    label: branch.name,
  }));

  const dayParam = date.format("YYYY-MM-DD");
  const scoreFrom = date.subtract(scoreDays - 1, "day").format("YYYY-MM-DD");

  const urls = useMemo(
    () => ({
      attention: withBranch(`api/v1/dashboard/attention?date=${dayParam}`, branchId),
      scores: withBranch(
        `api/v1/dashboard/scores?from=${scoreFrom}&to=${dayParam}`,
        branchId
      ),
      trend: withBranch(`api/v1/dashboard/trend?months=${trendMonths}`, branchId),
      capacity: withBranch("api/v1/dashboard/capacity", branchId),
      archive: "api/v1/dashboard/all",
    }),
    [dayParam, scoreFrom, trendMonths, branchId]
  );

  const attentionReq = usePolledRequest(demo ? null : urls.attention, LIVE_REFRESH_MS);
  const scoresReq = usePolledRequest(demo ? null : urls.scores);
  const trendReq = usePolledRequest(demo ? null : urls.trend);
  const capacityReq = usePolledRequest(demo ? null : urls.capacity);
  const archiveReq = usePolledRequest(demo ? null : urls.archive);

  const attention = resolve(demo, DEMO_ATTENTION, attentionReq);
  const scores = resolve(demo, DEMO_SCORES, scoresReq);
  const trend = resolve(demo, DEMO_TREND, trendReq);
  const capacity = resolve(demo, DEMO_CAPACITY, capacityReq);
  const archive = resolve(demo, DEMO_ARCHIVE, archiveReq);

  return (
    <Space direction="vertical" size={20} style={{ width: "100%" }}>
      {demo && (
        <Alert
          type="warning"
          showIcon
          message={t("dashboard.demoBanner")}
          description={t("dashboard.demoHint")}
          action={
            <Button size="small" onClick={() => update({ demo: undefined })}>
              {t("dashboard.demoExit")}
            </Button>
          }
        />
      )}

      <Row justify="space-between" align="bottom" gutter={[16, 16]}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            {t("dashboard.title")}
          </Title>
          <Text type="secondary">{t("dashboard.subtitle")}</Text>
        </Col>
        <Col>
          <Space wrap>
            {isAdmin && (
              <Select
                allowClear
                style={{ minWidth: 200 }}
                placeholder={t("contest.selectBranch")}
                value={branchId}
                loading={branches.loading}
                onChange={(value) => update({ branch: value })}
                options={branchOptions}
              />
            )}
            <DatePicker
              allowClear={false}
              value={date}
              onChange={(value) =>
                value && update({ date: value.format("YYYY-MM-DD") })
              }
            />

            <Tooltip title={t("dashboard.demoHint")}>
              <Space size={6}>
                <ExperimentOutlined style={{ opacity: 0.65 }} />
                <Text style={{ fontSize: 13 }}>{t("dashboard.demoToggle")}</Text>
                <Switch
                  size="small"
                  checked={demo}
                  onChange={(checked) => update({ demo: checked ? "1" : undefined })}
                />
              </Space>
            </Tooltip>
          </Space>
        </Col>
      </Row>

      {/* <Section
        title={t("dashboard.attention")}
        hint={t("dashboard.attentionHint")}
        stale={attention.stale}
        extra={
          <Link to="/dashboard/attention">
            <Button size="small">{t("dashboard.openDesk")} →</Button>
          </Link>
        }
      >
        <AttentionPanel
          data={attention.data}
          loading={attention.loading}
          error={attention.error}
          onRetry={attention.refetch}
          example={DEMO_ATTENTION}
        />
      </Section> */}

      <Section
        title={t("dashboard.scores")}
        extra={
          <Segmented
            size="small"
            value={scoreDays}
            onChange={(value) => update({ days: value })}
            options={SCORE_RANGES.map((days) => ({
              value: days,
              label: `${days} ${t("dashboard.daysShort")}`,
            }))}
          />
        }
      >
        <ScoresPanel
          data={scores.data}
          loading={scores.loading}
          error={scores.error}
          onRetry={scores.refetch}
        />
      </Section>

      <Section
        title={t("dashboard.trend")}
        extra={
          <Segmented
            size="small"
            value={trendMonths}
            onChange={(value) => update({ months: value })}
            options={TREND_RANGES.map((months) => ({
              value: months,
              label: `${months} ${t("dashboard.monthsShort")}`,
            }))}
          />
        }
      >
        <TrendPanel
          data={trend.data}
          loading={trend.loading}
          error={trend.error}
          onRetry={trend.refetch}
        />
      </Section>

      <Section title={t("dashboard.capacity")}>
        <CapacityPanel
          data={capacity.data}
          loading={capacity.loading}
          error={capacity.error}
          onRetry={capacity.refetch}
        />
      </Section>

      {/* A branch admin sees one branch; a ranking of one bar says nothing. */}
      {isAdmin && (
        <Section title={t("dashboard.byBranch")}>
          <BreakdownPanel
            year={date.year()}
            dateBy={dateBy}
            onDateByChange={(value) => update({ dateBy: value })}
            demoRows={demo ? DEMO_BRANCH_BOOKINGS : undefined}
          />
        </Section>
      )}

      <Section title={t("dashboard.archive")} hint={t("dashboard.archiveHint")}>
        <ArchivePanel
          data={archive.data}
          loading={archive.loading}
          error={archive.error}
          onRetry={archive.refetch}
          isAdmin={isAdmin}
        />
      </Section>
    </Space>
  );
};

const DashboardPage = () => {
  const t = useT();
  const { user } = useSelector((state) => state.auth);

  const roles = user?.roles || [];
  const isAdmin = checkRole(roles, Role.ROLE_ADMIN);
  const isBranchAdmin = checkRole(roles, Role.ROLE_BRANCH_ADMIN);

  if (!isAdmin && !isBranchAdmin) return <SpeakerDashboard t={t} />;

  return <StaffDashboard t={t} isAdmin={isAdmin} />;
};

export default DashboardPage;
