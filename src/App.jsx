import React, { useState } from 'react';

const RATING_CRITERIA = [
  { id: 'acceptance', label: 'Приемка в ремонт' },
  { id: 'overall', label: 'Качество ремонта (в целом)' },
  { id: 'painting', label: 'Качество покраски' },
  { id: 'engine', label: 'Ремонт двигателя' },
  { id: 'hydro', label: 'Ремонт гидропередачи' },
  { id: 'transmission', label: 'Ремонт трансмиссии' },
  { id: 'wheelsets', label: 'Ремонт колесных пар' },
  { id: 'hydraulics', label: 'Ремонт гидравлического оборудования' },
  { id: 'electrics', label: 'Ремонт электрооборудования' },
  { id: 'pneumatics', label: 'Ремонт пневмооборудования' },
  { id: 'working_parts', label: 'Ремонт рабочих органов' },
  { id: 'cabin', label: 'Ремонт кабины управления' },
];

export default function ChecklistForm() {
  const [formData, setFormData] = useState({
    enterprise: '',
    date: new Date().toISOString().split('T')[0],
    location: '',
    machineType: '',
    machineNumber: '',
    repairType: '',
    repairTimeframe: '',
    contactInfo: '',
    defectResolved: 'Да',
    defectComment: '',
    ratings: {}, // { acceptance: { status: 'Удовлетворен' | 'Не удовлетворен', comment: '' } }
    otherRemarks: '',
    suggestions: '',
  });

  const [submitted, setSubmitted] = useState(false);

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

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxuynkMQXRmdeVGm1ggjcJNWn89BmrtUs3gD1-XmmbHbF670_demQYx7JkUcjYyh3PiNA/exec";

const handleSubmit = async (e) => {
  e.preventDefault();
  
  try {
    // ВApps Script требует no-cors или отправку в формате plain text при прямой отправке JSON
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
  }
};

  if (submitted) {
    return (
      <div style={{ maxWidth: '650px', margin: '40px auto', padding: '30px', textAlign: 'center', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <h2 style={{ color: '#D27D46' }}>Спасибо за участие в опросе!</h2>
        <p style={{ color: '#555', lineHeight: '1.6' }}>Ваше мнение необходимо нам для повышения качества ремонта.</p>
        <button onClick={() => setSubmitted(false)} style={{ marginTop: '20px', background: '#1A1818', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer' }}>Заполнить повторно</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '720px', margin: '20px auto', fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#F8F9FA', color: '#1A1818', padding: '15px' }}>
      {/* Шапка формы */}
      <div style={{ backgroundColor: '#1A1818', borderTop: '6px solid #D27D46', padding: '24px', borderRadius: '10px 10px 0 0', color: '#FFF' }}>
        <h1 style={{ margin: 0, fontSize: '22px', color: '#D27D46' }}>ООО «РПТ Групп»</h1>
        <h2 style={{ margin: '8px 0 0 0', fontSize: '18px', fontWeight: '400' }}>Чек-лист оценки качества ремонта</h2>
      </div>

      <form onSubmit={handleSubmit} style={{ backgroundColor: '#FFF', padding: '24px', borderRadius: '0 0 10px 10px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
        
        {/* Основная информация */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Предприятие проведения ремонта</label>
            <input type="text" style={inputStyle} value={formData.enterprise} onChange={(e) => setFormData({ ...formData, enterprise: e.target.value })} placeholder="Наименование предприятия" />
          </div>
          <div>
            <label style={labelStyle}>Дата</label>
            <input type="date" style={inputStyle} value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>Город, станция</label>
            <input type="text" style={inputStyle} value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label style={labelStyle}>Тип машины / оборудования *</label>
            <input type="text" required style={inputStyle} value={formData.machineType} onChange={(e) => setFormData({ ...formData, machineType: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>Номер машины / оборудования *</label>
            <input type="text" required style={inputStyle} value={formData.machineNumber} onChange={(e) => setFormData({ ...formData, machineNumber: e.target.value })} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
          <div>
            <label style={labelStyle}>Вид ремонта *</label>
            <input type="text" required style={inputStyle} value={formData.repairType} onChange={(e) => setFormData({ ...formData, repairType: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>Сроки ремонта</label>
            <input type="text" style={inputStyle} value={formData.repairTimeframe} onChange={(e) => setFormData({ ...formData, repairTimeframe: e.target.value })} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>ФИО, должность, номер телефона</label>
            <input type="text" style={inputStyle} value={formData.contactInfo} onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })} />
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #E2E8F0', margin: '25px 0' }} />

        {/* Вопрос по дефектной ведомости */}
        <div style={blockStyle}>
          <label style={{ ...labelStyle, fontSize: '15px' }}>Устранены ли замечания по дефектной ведомости? *</label>
          <div style={{ display: 'flex', gap: '20px', margin: '10px 0' }}>
            {['Да', 'Нет'].map((val) => (
              <label key={val} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input type="radio" name="defectResolved" value={val} checked={formData.defectResolved === val} onChange={() => setFormData({ ...formData, defectResolved: val })} />
                {val}
              </label>
            ))}
          </div>
          {formData.defectResolved === 'Нет' && (
            <textarea
              required
              style={textareaRequiredStyle}
              placeholder="Укажите, что именно не устранено *"
              value={formData.defectComment}
              onChange={(e) => setFormData({ ...formData, defectComment: e.target.value })}
            />
          )}
        </div>

        {/* Оценка критериев */}
        <h3 style={{ color: '#D27D46', fontSize: '16px', marginTop: '25px', marginBottom: '15px' }}>Оценка выполнения работ</h3>

        {RATING_CRITERIA.map((item) => {
          const currentRating = formData.ratings[item.id]?.status || '';
          return (
            <div key={item.id} style={blockStyle}>
              <label style={{ ...labelStyle, fontSize: '14px' }}>{item.label} *</label>
              <div style={{ display: 'flex', gap: '20px', margin: '8px 0' }}>
                {['Удовлетворен', 'Не удовлетворен'].map((val) => (
                  <label key={val} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="radio"
                      required
                      name={`rating_${item.id}`}
                      value={val}
                      checked={currentRating === val}
                      onChange={() => handleRatingStatusChange(item.id, val)}
                    />
                    {val}
                  </label>
                ))}
              </div>
              {currentRating === 'Не удовлетворен' && (
                <textarea
                  required
                  style={textareaRequiredStyle}
                  placeholder={`Опишите замечания по пункту "${item.label}" *`}
                  value={formData.ratings[item.id]?.comment || ''}
                  onChange={(e) => handleRatingCommentChange(item.id, e.target.value)}
                />
              )}
            </div>
          );
        })}

        {/* Дополнительные поля */}
        <div style={{ marginTop: '20px' }}>
          <label style={labelStyle}>Другие замечания по качеству ремонта</label>
          <textarea style={textareaStyle} value={formData.otherRemarks} onChange={(e) => setFormData({ ...formData, otherRemarks: e.target.value })} />
        </div>

        <div style={{ marginTop: '15px' }}>
          <label style={labelStyle}>Предложения по повышению качества ремонта</label>
          <textarea style={textareaStyle} value={formData.suggestions} onChange={(e) => setFormData({ ...formData, suggestions: e.target.value })} />
        </div>

        {/* Кнопка отправки */}
        <button type="submit" style={{ width: '100%', backgroundColor: '#D27D46', color: '#FFF', padding: '14px', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', marginTop: '25px' }}>
          Отправить чек-лист
        </button>

        {/* Контакты в подвале */}
        <div style={{ marginTop: '20px', fontSize: '12px', color: '#666', textAlign: 'center', lineHeight: '1.5' }}>
          Эл. почта: <strong>parshin@rptgrupp.ru</strong> | MAX / WhatsApp: <strong>8-913-700-07-55</strong>
        </div>
      </form>
    </div>
  );
}

// Стили
const inputStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CCC', boxSizing: 'border-box', marginTop: '4px' };
const labelStyle = { display: 'block', fontWeight: '600', fontSize: '13px', color: '#333' };
const blockStyle = { background: '#F8F9FA', padding: '12px 15px', borderRadius: '6px', marginBottom: '12px', borderLeft: '3px solid #D27D46' };
const textareaStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CCC', minHeight: '60px', boxSizing: 'border-box', marginTop: '4px' };
const textareaRequiredStyle = { ...textareaStyle, border: '1px solid #D27D46', backgroundColor: '#FFF5F0' };