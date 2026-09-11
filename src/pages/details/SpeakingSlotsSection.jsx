import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Card,
  Flex,
  Segmented,
  Skeleton,
  Empty,
  Button,
  Typography,
  Space,
  Select,
  Popconfirm,
  Tooltip,
} from 'antd';
import {
  ReloadOutlined,
  TeamOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  CloseOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { toast } from 'react-toastify';
import apiClient from '../../services/api';

const { Text } = Typography;

const DAYS = [
  { value: 'monday', label: 'Mon' },
  { value: 'tuesday', label: 'Tue' },
  { value: 'wednesday', label: 'Wed' },
  { value: 'thursday', label: 'Thu' },
  { value: 'friday', label: 'Fri' },
  { value: 'saturday', label: 'Sat' },
  { value: 'sunday', label: 'Sun' },
];

const DAY_NAMES = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

const SPEAKER_COLORS = [
  { bg: '#E6F1FB', fg: '#0C447C' }, // blue
  { bg: '#E1F5EE', fg: '#085041' }, // teal
  { bg: '#FAEEDA', fg: '#633806' }, // amber
  { bg: '#FBEAF0', fg: '#72243E' }, // pink
  { bg: '#EEEDFE', fg: '#3C3489' }, // purple
  { bg: '#FAECE7', fg: '#712B13' }, // coral
];

const colorFor = (index) => SPEAKER_COLORS[index % SPEAKER_COLORS.length];

const rowKey = (slotId, time) => `${slotId}__${time}`;
const isOk = (res) => res?.code === 200 || res?.success === true;
const errMsg = (e, fallback) =>
  e?.response?.data?.message || e?.message || fallback;

// "HH:mm" → minutes
const timeToMin = (t) => {
  const [h, m] = (t || '').split(':').map(Number);
  return h * 60 + m;
};

// Is the given time within any of the speaker's working ranges (e.g. "09:00-12:20")?
const isWithinRanges = (ranges, time) => {
  if (!Array.isArray(ranges) || !ranges.length) return false;
  const t = timeToMin(time);
  return ranges.some((r) => {
    const [start, end] = r.split('-');
    return t >= timeToMin(start) && t < timeToMin(end);
  });
};

// ─── Main Section ────────────────────────────────────────────────────────────

const SpeakingSlotsSection = ({ branchId }) => {
  const [day, setDay] = useState(() => DAY_NAMES[new Date().getDay()]);
  const [slotsData, setSlotsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [addingSlot, setAddingSlot] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [deletingSlotId, setDeletingSlotId] = useState(null);

  // per-row UI state
  const [editing, setEditing] = useState({}); // key -> true (filled row in edit mode)
  const [drafts, setDrafts] = useState({}); // key -> selected speakerId (pending)
  const [rowState, setRowState] = useState({}); // key -> { busy, warning, error }

  const patchRowState = (key, patch) =>
    setRowState((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));

  const resetRowUi = () => {
    setEditing({});
    setDrafts({});
    setRowState({});
  };

  const fetchSlots = useCallback(async () => {
    setLoading(true);
    setError(null);
    resetRowUi();
    try {
      const res = await apiClient.get(
        `api/v1/branch/${branchId}/slots?day=${day.toUpperCase()}`
      );
      if (isOk(res)) {
        setSlotsData(res.data);
      } else {
        setError(res.message || 'Failed to load speaking slots');
      }
    } catch (err) {
      setError(errMsg(err, 'Failed to load speaking slots'));
    } finally {
      setLoading(false);
    }
  }, [branchId, day]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  const handleDayChange = (value) => {
    setDay(value);
  };

  // Branch speakers — prefer top-level list (has ranges); fall back to row data.
  const speakers = useMemo(() => {
    if (Array.isArray(slotsData?.speakers) && slotsData.speakers.length) {
      return slotsData.speakers;
    }
    const map = new Map();
    (slotsData?.slots || []).forEach((slot) => {
      (slot.rows || []).forEach((row) => {
        if (row.speaker && !map.has(row.speaker.id)) {
          map.set(row.speaker.id, row.speaker);
        }
      });
    });
    return Array.from(map.values());
  }, [slotsData]);

  const colorMap = useMemo(() => {
    const map = {};
    speakers.forEach((sp, index) => {
      map[sp.id] = colorFor(index);
    });
    return map;
  }, [speakers]);

  // Immutably update a single row inside slotsData.
  const updateRow = useCallback((slotId, time, updater) => {
    setSlotsData((prev) =>
      !prev
        ? prev
        : {
            ...prev,
            slots: prev.slots.map((s) =>
              (s.id ?? s.slot_index) === slotId
                ? {
                    ...s,
                    rows: s.rows.map((r) =>
                      r.time === time ? updater(r) : r
                    ),
                  }
                : s
            ),
          }
    );
  }, []);

  // Block any send when the speaker does not work at this time.
  const isOffSchedule = (speaker, time) =>
    Array.isArray(speaker?.ranges) && !isWithinRanges(speaker.ranges, time);

  // ── Assign (empty row → POST) ──────────────────────────────────────────────
  const handleAssign = async (slot, row, speakerId) => {
    const slotId = slot.id ?? slot.slot_index;
    const key = rowKey(slotId, row.time);
    const speaker = speakers.find((s) => s.id === speakerId);
    if (!speaker) return;
    if (isOffSchedule(speaker, row.time)) {
      const m = `${speaker.name} is not scheduled to work at ${row.time}`;
      patchRowState(key, { error: m });
      toast.warn(m);
      return;
    }
    const snapshot = slotsData;

    patchRowState(key, { busy: true, error: null, warning: null });
    updateRow(slotId, row.time, (r) => ({ ...r, speaker }));
    try {
      const res = await apiClient.post(
        `api/v1/branch/${branchId}/slot-assignments`,
        {
          slot_id: slot.id,
          day: day.toUpperCase(),
          time: row.time,
          speaker_id: speakerId,
        }
      );
      if (!isOk(res)) throw new Error(res?.message);
      const newId = res.data?.assignment_id ?? res.data?.id ?? null;
      updateRow(slotId, row.time, (r) => ({ ...r, assignment_id: newId, speaker }));
      const warning = res.data?.warning || res.warning;
      patchRowState(key, { busy: false, warning: warning || null });
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } catch (e) {
      setSlotsData(snapshot); // rollback
      const m = errMsg(e, 'Failed to assign speaker');
      patchRowState(key, { busy: false, error: m });
      toast.error(m);
    }
  };

  // ── Edit (filled row → PATCH) ──────────────────────────────────────────────
  const handleEdit = async (slot, row, speakerId) => {
    const slotId = slot.id ?? slot.slot_index;
    const key = rowKey(slotId, row.time);
    if (speakerId === row.speaker?.id) {
      setEditing((p) => ({ ...p, [key]: false }));
      return;
    }
    const speaker = speakers.find((s) => s.id === speakerId);
    if (!speaker) return;
    if (isOffSchedule(speaker, row.time)) {
      const m = `${speaker.name} is not scheduled to work at ${row.time}`;
      patchRowState(key, { error: m });
      toast.warn(m);
      return;
    }
    const snapshot = slotsData;

    patchRowState(key, { busy: true, error: null, warning: null });
    updateRow(slotId, row.time, (r) => ({ ...r, speaker }));
    try {
      const res = await apiClient.put(
        `api/v1/branch/${branchId}/slot-assignments/${row.assignment_id}`,
        { speaker_id: speakerId }
      );
      if (!isOk(res)) throw new Error(res?.message);
      const warning = res.data?.warning || res.warning;
      patchRowState(key, { busy: false, warning: warning || null });
      setEditing((p) => ({ ...p, [key]: false }));
    } catch (e) {
      setSlotsData(snapshot); // rollback
      const m = errMsg(e, 'Failed to update assignment');
      patchRowState(key, { busy: false, error: m });
      toast.error(m);
    }
  };

  // ── Remove (filled row → DELETE) ───────────────────────────────────────────
  const handleRemove = async (slot, row) => {
    const slotId = slot.id ?? slot.slot_index;
    const key = rowKey(slotId, row.time);
    const snapshot = slotsData;

    patchRowState(key, { busy: true, error: null, warning: null });
    updateRow(slotId, row.time, (r) => ({
      ...r,
      speaker: null,
      assignment_id: null,
    }));
    try {
      const res = await apiClient.delete(
        `api/v1/branch/${branchId}/slot-assignments/${row.assignment_id}`
      );
      if (!isOk(res)) throw new Error(res?.message);
      patchRowState(key, { busy: false });
    } catch (e) {
      setSlotsData(snapshot); // rollback
      const m = errMsg(e, 'Failed to remove assignment');
      patchRowState(key, { busy: false, error: m });
      toast.error(m);
    }
  };

  // ── Add slot / Reset (structure changes → refetch) ─────────────────────────
  const handleAddSlot = async () => {
    setAddingSlot(true);
    try {
      const res = await apiClient.post(
        `api/v1/branch/${branchId}/slots`,
        { day: day.toUpperCase() }
      );
      if (!isOk(res)) throw new Error(res?.message);
      await fetchSlots();
    } catch (e) {
      toast.error(errMsg(e, 'Failed to add slot'));
    } finally {
      setAddingSlot(false);
    }
  };

  const handleDeleteSlot = async (slot) => {
    const slotId = slot.id ?? slot.slot_index;
    setDeletingSlotId(slotId);
    try {
      const res = await apiClient.delete(
        `api/v1/branch/${branchId}/slots/${slot.id}`
      );
      if (!isOk(res)) throw new Error(res?.message);
      await fetchSlots();
    } catch (e) {
      toast.error(errMsg(e, 'Failed to delete slot'));
    } finally {
      setDeletingSlotId(null);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      const res = await apiClient.post(
        `api/v1/branch/${branchId}/slots/reset?day=${day.toUpperCase()}`
      );
      if (!isOk(res)) throw new Error(res?.message);
      await fetchSlots();
    } catch (e) {
      toast.error(errMsg(e, 'Failed to reset schedule'));
    } finally {
      setResetting(false);
    }
  };

  const hasSlots = (slotsData?.slots?.length ?? 0) > 0;

  return (
    <Card
      title={
        <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
          <Space>
            <TeamOutlined />
            <span>Speaking Schedule</span>
          </Space>
          <Space size={8} wrap>
            <Segmented
              options={DAYS}
              value={day}
              onChange={handleDayChange}
              size="small"
            />
            <Popconfirm
              title="Reset to schedule?"
              description="Manual changes will be discarded."
              okText="Reset"
              cancelText="Cancel"
              onConfirm={handleReset}
            >
              <Button
                type="link"
                size="small"
                danger
                loading={resetting}
                style={{ paddingInline: 4 }}
              >
                Reset to schedule
              </Button>
            </Popconfirm>
          </Space>
        </Flex>
      }
      styles={{ header: { flexWrap: 'wrap' } }}
    >
      {/* Info line */}
      {slotsData?.meta?.max_simultaneous_speakers != null && (
        <Text
          type="secondary"
          style={{ display: 'block', marginBottom: 12, fontSize: 13 }}
        >
          {speakers.length} speakers → up to{' '}
          <Text strong>{slotsData.meta.max_simultaneous_speakers}</Text> rooms
          in use at once
        </Text>
      )}

      {/* Speaker pool */}
      {speakers.length > 0 && (
        <div
          style={{
            background: '#fafafa',
            border: '0.5px solid #f0f0f0',
            borderRadius: 8,
            padding: '8px 10px',
            marginBottom: 16,
          }}
        >
          <Flex gap={8} wrap="wrap">
            {speakers.map((sp) => {
              const c = colorMap[sp.id];
              const ranges =
                sp.ranges && sp.ranges.length
                  ? sp.ranges.map((r) => r.replace('-', '–')).join(', ')
                  : '—';
              return (
                <span
                  key={sp.id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '3px 10px',
                    borderRadius: 20,
                    fontSize: 12,
                    background: c.bg,
                    color: c.fg,
                  }}
                >
                  <Text strong style={{ color: c.fg, fontSize: 12 }}>
                    {sp.name}
                  </Text>
                  <span style={{ opacity: 0.7 }}>· {ranges}</span>
                </span>
              );
            })}
          </Flex>
        </div>
      )}

      {/* Body */}
      {loading ? (
        <SlotsSkeleton />
      ) : error ? (
        <Flex vertical align="center" gap={10} style={{ padding: '24px 0' }}>
          <Text type="danger">{error}</Text>
          <Button icon={<ReloadOutlined />} onClick={fetchSlots}>
            Retry
          </Button>
        </Flex>
      ) : (
        <>
          {!hasSlots ? (
            <Empty
              description="No speaking slots for this day"
              style={{ padding: '24px 0' }}
            />
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: 16,
              }}
            >
              {slotsData.slots.map((slot) => (
                <SlotCard
                  key={slot.id ?? slot.slot_index}
                  slot={slot}
                  colorMap={colorMap}
                  speakers={speakers}
                  editing={editing}
                  setEditing={setEditing}
                  drafts={drafts}
                  setDrafts={setDrafts}
                  rowState={rowState}
                  onAssign={handleAssign}
                  onEdit={handleEdit}
                  onRemove={handleRemove}
                  onDeleteSlot={handleDeleteSlot}
                  deleting={
                    deletingSlotId === (slot.id ?? slot.slot_index)
                  }
                />
              ))}
            </div>
          )}

          {/* Add slot */}
          {/* <Button
            type="dashed"
            icon={<PlusOutlined />}
            block
            loading={addingSlot}
            onClick={handleAddSlot}
            style={{ marginTop: 16 }}
          >
            Add new slot
          </Button> */}
        </>
      )}
    </Card>
  );
};

// ─── Slot Card ────────────────────────────────────────────────────────────────

const SlotCard = ({
  slot,
  colorMap,
  speakers,
  editing,
  setEditing,
  drafts,
  setDrafts,
  rowState,
  onAssign,
  onEdit,
  onRemove,
  onDeleteSlot,
  deleting,
}) => {
  const slotId = slot.id ?? slot.slot_index;
  const rows = useMemo(() => slot.rows || [], [slot.rows]);
  const filledCount = useMemo(
    () => rows.filter((r) => r.speaker).length,
    [rows]
  );

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        border: '1px solid #e8e8e8',
        overflow: 'hidden',
        minWidth: 240,
      }}
    >
      {/* Header */}
      <div
        style={{
          background: '#fafafa',
          padding: '7px 12px',
          borderBottom: '0.5px solid #e8e8e8',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text strong style={{ fontSize: 13 }}>
          {slot.name}
        </Text>
        <Space size={6} align="center">
          <Text type="secondary" style={{ fontSize: 12 }}>
            filled: {filledCount} / {rows.length}
          </Text>
          <Popconfirm
            title="Delete slot?"
            description="The slot and all its assignments will be deleted."
            okText="Delete"
            okButtonProps={{ danger: true }}
            cancelText="Cancel"
            onConfirm={() => onDeleteSlot(slot)}
          >
            <Button
              size="small"
              type="text"
              danger
              icon={<DeleteOutlined />}
              loading={deleting}
              style={iconBtnStyle}
            />
          </Popconfirm>
        </Space>
      </div>

      {/* Column labels */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '64px 1fr 60px',
          padding: '4px 8px',
          borderBottom: '0.5px solid #e8e8e8',
          background: '#f5f5f5',
        }}
      >
        <Text type="secondary" style={{ fontSize: 11 }}>
          Vaqt
        </Text>
        <Text type="secondary" style={{ fontSize: 11 }}>
          Speaker
        </Text>
        <span />
      </div>

      {/* Rows */}
      {rows.length === 0 ? (
        <div style={{ padding: '14px 12px', textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Empty
          </Text>
        </div>
      ) : (
        rows.map((row, index) => (
          <SlotRow
            key={row.time}
            slot={slot}
            row={row}
            isLast={index === rows.length - 1}
            colorMap={colorMap}
            speakers={speakers}
            isEditing={!!editing[rowKey(slotId, row.time)]}
            setEditing={setEditing}
            draft={drafts[rowKey(slotId, row.time)]}
            setDrafts={setDrafts}
            state={rowState[rowKey(slotId, row.time)] || {}}
            onAssign={onAssign}
            onEdit={onEdit}
            onRemove={onRemove}
          />
        ))
      )}
    </div>
  );
};

// ─── Slot Row ─────────────────────────────────────────────────────────────────

const iconBtnStyle = {
  width: 26,
  height: 26,
  minWidth: 26,
  padding: 0,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const SlotRow = ({
  slot,
  row,
  isLast,
  colorMap,
  speakers,
  isEditing,
  setEditing,
  draft,
  setDrafts,
  state,
  onAssign,
  onEdit,
  onRemove,
}) => {
  const slotId = slot.id ?? slot.slot_index;
  const key = rowKey(slotId, row.time);
  const filled = !!row.speaker;
  const busy = !!state.busy;
  const c = filled ? colorMap[row.speaker.id] : null;

  // Per-time options annotated with whether the speaker works at this time.
  const options = useMemo(
    () =>
      (speakers || []).map((sp) => {
        const hasInfo = Array.isArray(sp.ranges);
        const available = hasInfo && isWithinRanges(sp.ranges, row.time);
        return {
          value: sp.id,
          title: sp.name, // used for search + native tooltip
          disabled: hasInfo && !available, // off-schedule → not selectable
          label: (
            <Flex justify="space-between" align="center" gap={8}>
              <span
                style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
              >
                {sp.name}
              </span>
              {hasInfo && (
                <span
                  style={{
                    fontSize: 11,
                    whiteSpace: 'nowrap',
                    color: available ? '#389e0d' : '#d48806',
                  }}
                >
                  {available ? 'available' : 'off-schedule'}
                </span>
              )}
            </Flex>
          ),
        };
      }),
    [speakers, row.time]
  );

  const setDraft = (value) =>
    setDrafts((prev) => ({ ...prev, [key]: value }));
  const setEdit = (value) =>
    setEditing((prev) => ({ ...prev, [key]: value }));

  return (
    <div
      style={{
        borderBottom: isLast ? 'none' : '0.5px solid #f0f0f0',
        background: filled ? '#fff' : '#fafbfc',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '64px 1fr 60px',
          alignItems: 'center',
          minHeight: 36,
          padding: '3px 8px',
          gap: 6,
        }}
      >
        {/* Time */}
        <Text style={{ fontSize: 13, color: '#595959' }}>{row.time}</Text>

        {/* Speaker cell */}
        <div style={{ minWidth: 0 }}>
          {filled && !isEditing ? (
            <Flex align="center" gap={4}>
              <span
                style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 500,
                  background: c?.bg || '#f0f0f0',
                  color: c?.fg || '#595959',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '100%',
                }}
              >
                {row.speaker.name}
              </span>
              {state.warning && (
                <Tooltip title={state.warning}>
                  <WarningOutlined style={{ color: '#d48806', fontSize: 13 }} />
                </Tooltip>
              )}
            </Flex>
          ) : filled && isEditing ? (
            <Select
              size="small"
              style={{ width: '100%' }}
              defaultValue={row.speaker.id}
              options={options}
              loading={busy}
              disabled={busy}
              onChange={(value) => onEdit(slot, row, value)}
              showSearch
              optionFilterProp="title"
            />
          ) : (
            <Select
              size="small"
              style={{ width: '100%' }}
              placeholder="— Select speaker —"
              value={draft}
              options={options}
              disabled={busy}
              onChange={setDraft}
              showSearch
              optionFilterProp="title"
              status={state.error ? 'error' : undefined}
            />
          )}
          {state.error && (
            <Text type="danger" style={{ fontSize: 11, display: 'block' }}>
              {state.error}
            </Text>
          )}
        </div>

        {/* Actions */}
        <Flex gap={4} justify="flex-end">
          {filled && !isEditing && (
            <>
              <Button
                size="small"
                icon={<EditOutlined />}
                style={iconBtnStyle}
                disabled={busy}
                onClick={() => setEdit(true)}
              />
              <Popconfirm
                title="Remove?"
                okText="Yes"
                cancelText="No"
                onConfirm={() => onRemove(slot, row)}
              >
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  style={iconBtnStyle}
                  loading={busy}
                />
              </Popconfirm>
            </>
          )}
          {filled && isEditing && (
            <Button
              size="small"
              icon={<CloseOutlined />}
              style={iconBtnStyle}
              disabled={busy}
              onClick={() => setEdit(false)}
            />
          )}
          {!filled && (
            <Button
              size="small"
              type="primary"
              icon={<PlusOutlined />}
              style={iconBtnStyle}
              loading={busy}
              disabled={!draft}
              onClick={() => onAssign(slot, row, draft)}
            />
          )}
        </Flex>
      </div>
    </div>
  );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SlotsSkeleton = () => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
      gap: 16,
    }}
  >
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        style={{
          borderRadius: 12,
          border: '1px solid #e8e8e8',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            background: '#fafafa',
            padding: '8px 12px',
            borderBottom: '0.5px solid #e8e8e8',
          }}
        >
          <Skeleton.Input active size="small" style={{ width: 80 }} />
        </div>
        {[1, 2, 3, 4, 5].map((j) => (
          <div
            key={j}
            style={{
              padding: '5px 8px',
              borderBottom: '0.5px solid #f0f0f0',
            }}
          >
            <Skeleton.Input active size="small" style={{ width: '100%' }} />
          </div>
        ))}
      </div>
    ))}
  </div>
);

export default SpeakingSlotsSection;
