import { Fragment, useState } from 'react';
import './App.css';

const RATING_CRITERIA = [
  { id: 'acceptance', label: 'Приемка в ремонт' },
  { id: 'overall', label: 'Качество ремонта (в целом)' },
  { id: 'engine', label: 'Ремонт двигателя' },
  { id: 'hydro', label: 'Ремонт гидропередачи' },
  { id: 'transmission', label: 'Ремонт трансмиссии' },
  { id: 'wheelsets', label: 'Ремонт колесных пар' },
  { id: 'hydraulics', label: 'Ремонт гидравлического оборудования' },
  { id: 'electrics', label: 'Ремонт электрооборудования' },
  { id: 'pneumatics', label: 'Ремонт пневмооборудования' },
  { id: 'working_parts', label: 'Ремонт рабочих органов' },
  { id: 'painting', label: 'Качество покраски' },
  { id: 'cabin', label: 'Ремонт кабины управления' },
];

// Блок про дефектную ведомость встаёт в список сразу после этого пункта.
const DEFECT_BLOCK_AFTER = 'overall';

const GOOGLE_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbxuynkMQXRmdeVGm1ggjcJNWn89BmrtUs3gD1-XmmbHbF670_demQYx7JkUcjYyh3PiNA/exec';

const EMPTY_FORM = {
  enterprise: '',
  date: new Date().toISOString().split('T')[0],
  location: '',
  machineType: '',
  machineNumber: '',
  repairType: '',
  repairTimeframe: '',
  contactInfo: '',
  defectResolved: '',
  defectComment: '',
  ratings: {}, // { acceptance: { status: 'Удовлетворен' | 'Не удовлетворен', comment: '' } }
  otherRemarks: '',
  suggestions: '',
};

// Доля заполненных обязательных полей — для полосы прогресса в шапке.
function calcProgress(data) {
  let total = 4; // machineType, machineNumber, repairType, defectResolved
  let filled = 0;
  if (data.machineType.trim()) filled++;
  if (data.machineNumber.trim()) filled++;
  if (data.repairType.trim()) filled++;
  if (data.defectResolved) filled++;
  if (data.defectResolved === 'Нет') {
    total++;
    if (data.defectComment.trim()) filled++;
  }

  RATING_CRITERIA.forEach((item) => {
    const rating = data.ratings[item.id];
    total++;
    if (rating?.status) filled++;
    if (rating?.status === 'Не удовлетворен') {
      total++;
      if ((rating.comment || '').trim()) filled++;
    }
  });

  return Math.round((filled / total) * 100);
}

export default function ChecklistForm() {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  const setField = (key) => (e) =>
    setFormData((prev) => ({ ...prev, [key]: e.target.value }));

  const handleRatingStatusChange = (id, status) => {
    setFormData((prev) => ({
      ...prev,
      ratings: {
        ...prev.ratings,
        [id]: { status, comment: prev.ratings[id]?.comment || '' },
      },
    }));
  };

  const handleRatingCommentChange = (id, comment) => {
    setFormData((prev) => ({
      ...prev,
      ratings: {
        ...prev.ratings,
        [id]: { ...prev.ratings[id], comment },
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);

    try {
      // Apps Script принимает JSON только как plain text и без CORS-заголовков.
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(formData),
      });

      setSubmitted(true);
    } catch (err) {
      console.error('Ошибка отправки:', err);
      alert('Произошла ошибка при отправке формы. Попробуйте снова.');
    } finally {
      setSending(false);
    }
  };

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setSubmitted(false);
    window.scrollTo({ top: 0 });
  };

  if (submitted) {
    return (
      <div className="page">
        <div className="shell">
          <div className="done">
            <div className="done-mark">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 12.5L9.5 18L20 6"
                  stroke="var(--ok-text)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2>Спасибо за оценку</h2>
            <p>
              Каждый отзыв помогает нам находить слабые места в ремонте и повышать качество на
              следующем цикле. Мы разберём ваши замечания и учтём их в работе.
            </p>
            <button type="button" onClick={resetForm}>
              Заполнить ещё раз
            </button>
          </div>
        </div>
      </div>
    );
  }

  const progress = calcProgress(formData);

  return (
    <div className="page">
      <div className="shell">
        <header className="header">
          <div className="header-row">
            <div>
              <div className="brand">
                {!logoFailed && (
                  <span className="brand-logo">
                    <img
                      src="/assets/logo.png"
                      alt="РПТ Групп"
                      onError={() => setLogoFailed(true)}
                    />
                  </span>
                )}
                <span className="brand-name">ООО «РПТ Групп»</span>
              </div>
              <h1>Чек-лист оценки качества ремонта</h1>
              <p>
                Ваша оценка напрямую влияет на то, как мы улучшаем ремонт. Расскажите честно — мы
                стремимся к совершенству на каждом этапе.
              </p>
            </div>
            <svg
              className="header-mark"
              width="46"
              height="46"
              viewBox="0 0 46 46"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M5 32L16 20L24 27L41 8"
                stroke="var(--accent)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M31 8H41V18"
                stroke="var(--accent)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </header>

        <div className="progress">
          <div className="progress-head">
            <span>Заполнено</span>
            <span>{progress}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-bar" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <form className="form" onSubmit={handleSubmit}>
          <div className="panel">
            <div className="grid">
                <div>
                  <label className="label" htmlFor="date">
                    Дата
                  </label>
                  <input
                    id="date"
                    type="date"
                    className="input"
                    value={formData.date}
                    onChange={setField('date')}
                  />
                </div>
                <div>
                  <label className="label" htmlFor="location">
                    Город, станция
                  </label>
                  <input
                    id="location"
                    type="text"
                    className="input"
                    value={formData.location}
                    onChange={setField('location')}
                  />
                </div>
                <div className="full">
                  <label className="label" htmlFor="enterprise">
                    Предприятие проведения ремонта
                  </label>
                  <input
                    id="enterprise"
                    type="text"
                    className="input"
                    placeholder="Наименование предприятия"
                    value={formData.enterprise}
                    onChange={setField('enterprise')}
                  />
                </div>
                <div>
                  <label className="label" htmlFor="machineType">
                    Тип машины / оборудования *
                  </label>
                  <input
                    id="machineType"
                    type="text"
                    required
                    className="input"
                    value={formData.machineType}
                    onChange={setField('machineType')}
                  />
                </div>
                <div>
                  <label className="label" htmlFor="machineNumber">
                    Номер машины / оборудования *
                  </label>
                  <input
                    id="machineNumber"
                    type="text"
                    required
                    className="input"
                    value={formData.machineNumber}
                    onChange={setField('machineNumber')}
                  />
                </div>
                <div>
                  <label className="label" htmlFor="repairType">
                    Вид ремонта *
                  </label>
                  <input
                    id="repairType"
                    type="text"
                    required
                    className="input"
                    value={formData.repairType}
                    onChange={setField('repairType')}
                  />
                </div>
                <div>
                  <label className="label" htmlFor="repairTimeframe">
                    Сроки ремонта
                  </label>
                  <input
                    id="repairTimeframe"
                    type="text"
                    className="input"
                    value={formData.repairTimeframe}
                    onChange={setField('repairTimeframe')}
                  />
                </div>
                <div className="full">
                  <label className="label" htmlFor="contactInfo">
                    ФИО, должность, номер телефона
                  </label>
                  <input
                    id="contactInfo"
                    type="text"
                    className="input"
                    value={formData.contactInfo}
                    onChange={setField('contactInfo')}
                  />
                </div>
            </div>
          </div>

          <div className="panel panel--quality">
            <div className="quality-bg" aria-hidden="true">
              <span className="quality-bg-a" />
              <span className="quality-bg-photo quality-bg-b" />
              <span className="quality-bg-photo quality-bg-c" />
            </div>
            <div className="section-title">
              <h3>Качество выполненных работ</h3>
            </div>
            <p className="section-note">
              Отметьте по каждому пункту — это основа для нашего плана улучшений.
            </p>

            {RATING_CRITERIA.map((item) => {
              const rating = formData.ratings[item.id];
              const isSatisfied = rating?.status === 'Удовлетворен';
              const isUnsatisfied = rating?.status === 'Не удовлетворен';
              return (
                <Fragment key={item.id}>
                <div className="rating">
                  <label>{item.label} *</label>
                  <div className="choices">
                    <label className={`choice${isSatisfied ? ' on-ok' : ''}`}>
                      <input
                        type="radio"
                        required
                        name={`rating_${item.id}`}
                        value="Удовлетворен"
                        checked={isSatisfied}
                        onChange={() => handleRatingStatusChange(item.id, 'Удовлетворен')}
                      />
                      ✓ Удовлетворён
                    </label>
                    <label className={`choice${isUnsatisfied ? ' on-bad' : ''}`}>
                      <input
                        type="radio"
                        required
                        name={`rating_${item.id}`}
                        value="Не удовлетворен"
                        checked={isUnsatisfied}
                        onChange={() => handleRatingStatusChange(item.id, 'Не удовлетворен')}
                      />
                      ✕ Не удовлетворён
                    </label>
                  </div>
                  <textarea
                    required={isUnsatisfied}
                    className={`textarea${isUnsatisfied ? ' required' : ''}`}
                    placeholder={
                      isUnsatisfied
                        ? `Опишите замечания по пункту «${item.label}» *`
                        : 'Комментарий по пункту'
                    }
                    value={rating?.comment || ''}
                    onChange={(e) => handleRatingCommentChange(item.id, e.target.value)}
                  />
                </div>

                {item.id === DEFECT_BLOCK_AFTER && (
                  <div className="defect">
                    <label>Устранены ли замечания по дефектной ведомости? *</label>
                    {['Да', 'Нет'].map((val) => (
                      <label
                        key={val}
                        className={`pill${formData.defectResolved === val ? ' on' : ''}`}
                      >
                        <input
                          type="radio"
                          required
                          name="defectResolved"
                          value={val}
                          checked={formData.defectResolved === val}
                          onChange={() =>
                            setFormData((prev) => ({ ...prev, defectResolved: val }))
                          }
                        />
                        {val}
                      </label>
                    ))}
                    {formData.defectResolved === 'Нет' && (
                      <textarea
                        required
                        className="textarea required"
                        placeholder="Укажите, что именно не устранено *"
                        value={formData.defectComment}
                        onChange={setField('defectComment')}
                      />
                    )}
                  </div>
                )}
                </Fragment>
              );
            })}

            <div className="field">
              <label className="label" htmlFor="otherRemarks">
                Другие замечания по качеству ремонта
              </label>
              <textarea
                id="otherRemarks"
                className="textarea"
                value={formData.otherRemarks}
                onChange={setField('otherRemarks')}
              />
            </div>

            <div className="field">
              <label className="label" htmlFor="suggestions">
                Предложения по повышению качества ремонта
              </label>
              <textarea
                id="suggestions"
                className="textarea"
                value={formData.suggestions}
                onChange={setField('suggestions')}
              />
            </div>
          </div>

          <button type="submit" className="submit" disabled={sending}>
            {sending ? 'Отправляем…' : 'Отправить чек-лист'}
          </button>

          <div className="footer">
            Эл. почта: <strong>parshin@rptgrupp.ru</strong> &nbsp;|&nbsp; MAX / WhatsApp:{' '}
            <strong>8-913-700-07-55</strong>
          </div>
        </form>
      </div>
    </div>
  );
}
