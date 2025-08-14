import { useState } from 'react';
import cakesData from '../data/cake.json';
import Select from 'react-select';
import "./OrderCake.css";
import DatePicker, { CalendarContainer } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ja } from 'date-fns/locale';
// import { data } from 'react-router-dom';
import { addDays, isAfter, isSameDay, getDay } from 'date-fns';
import type { StylesConfig, GroupBase } from 'react-select';
import type { ReactNode } from "react";

const API_URL = import.meta.env.VITE_API_URL;

type CakeOrder = {
  cake: string;
  quantity: string;
  size: string;
}

type OptionType = {
  value: string;
  label: string;
};

type MyContainerProps = {
  className?: string;
  children?: ReactNode;
};

export default function OrderCake() {
  
  const MyContainer = ({ className, children }: MyContainerProps) => {
    return (
      <div>
        <CalendarContainer className={className}>{children}</CalendarContainer>
        <div className='calendar-notice'>
          <div style={{ padding: "20px" }}>
              <p>３日前よりご予約可能（２週間後まで）</p>
            </div>
          <div className='notice'>
            <div className='selectable'></div>
            {/* <div style={{ padding: "20px" }}> */}
              <span>予約可能日  /  <span className='yassumi'>休</span> 休業日</span>
            {/* </div> */}
          </div>
        </div>
      </div>
    );
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const cakeOptions: OptionType[] = cakesData.cakes.map(c => ({
    value: String(c.id_cake),
    label: c.name
  }));

  const [cakes, setCakes] = useState<CakeOrder[]>([
    {cake: String(cakesData.cakes[0].id_cake), quantity: "1", size: ""},
  ]);
  
  const quantityOptions: OptionType[] = Array.from({ length: 10 }, (_, i) => ({
    value: String(i + 1),
    label: String(i + 1),
  }));

  const addCake = () => {
    setCakes(prev => [...prev, {cake: "0", quantity: "1", size: ""}]);
  };
  
  const removeCake = (index: number) => {
    setCakes(prev => prev.filter((_, i) => i !== index))
  };

  const updateCake = (index: number, field: keyof CakeOrder, value: string) => {
    setCakes(prev => 
      prev.map((item, i) => (i === index ? {...item, [field]: value } : item))
    );
  };
  const [pickupHour, setPickupHour] = useState("11~13時");

  const hoursOptions = [
    { value: "11~13時", label: "11~13時" },
    { value: "13~17時", label: "13~17時" },
    { value: "17~19時", label: "17~19時" },
  ];

  const today = new Date();
  const blockDay = 3;

  const daysOff = [
    { day: 12, month: 7}, // mês 7 = agosto
    { day: 15, month: 7},
    { day: 20, month: 7},
    { day: 21, month: 7},
    { day: 20, month: 8},// mês 7 = setembro
    { day: 21, month: 8},
  ];

  const generateSpecificDatesWithMonth = () => {
    const dates: Date[] = [];

    daysOff.forEach(({ day, month }) => {
      const newDate = new Date(today.getFullYear(), month, day);
      if (isAfter(newDate, today)) {
        dates.push(newDate);
      }
    });
    return dates;
  };
  
  const generateBlockedDaysStart = () => {
    const dates: Date[] = [];
    let date = today;
    
    const fixedDates = new Set(
      generateSpecificDatesWithMonth().map(d => d.toDateString())
    );
    
    while (dates.length < blockDay) {
      const isBlockedforAFixedDate = fixedDates.has(date.toDateString());
      const alreadBlocked = dates.some(d => isSameDay(d, date));
      
      if (!isBlockedforAFixedDate && !alreadBlocked) {
        dates.push(date);
      }
      date = addDays(date, 1);
    }
    return dates;
  }
  
  const excludedDates = [
    ...generateBlockedDaysStart(),
    ...generateSpecificDatesWithMonth(),
  ];

  const isDateAllowed = (date: Date) => !excludedDates.some((d) => isSameDay(d, date));
  // const maxDate = endOfMonth(addDays(today, 31));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  const customStyles: StylesConfig<OptionType, false, GroupBase<OptionType>> = {
    control: (provided, state) => ({
      ...provided,
      borderColor: state.isFocused ? '#FF7F50' : '#ccc',
      boxShadow: 'none',
      border: '1px solid #000',
      borderRadius: '10px',
      paddingTop: '10px',
      paddingBottom: '10px',
      '&:hover': {
        borderColor: '#FF7F50',
      },
    }),
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.blur(); // impede abrir teclado no celular
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const telInput = (document.getElementById("tel") as HTMLInputElement).value;
    const tel = telInput.replace(/\D/g, '');
    const id_client = tel.slice(-4);

    const data = {
      // id_client: Math.random().toString(36).substring(2, 8),
      id_client,
      first_name: (document.getElementById("firstname") as HTMLInputElement).value,
      last_name: (document.getElementById("lastname") as HTMLInputElement).value,
      email: (document.getElementById("email") as HTMLInputElement).value,
      tel,
      // date: (document.getElementById("date") as HTMLSelectElement).value,
      date: selectedDate?.toISOString().split('T')[0] || "",
      pickupHour: (document.getElementById("pickupHour") as HTMLSelectElement).value,
      message: (document.getElementById("message") as HTMLTextAreaElement).value,
      cakes: cakes.map(c => {
        const cakeData = cakesData.cakes.find(cake => Number(cake.id_cake) === Number(c.cake));
        return {
          ...cakeData,
          amount: parseInt(c.quantity)
        };
      })
    };

    try {
      const res = await fetch(`${API_URL}/api/reserva`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (result.success) {
        // setOrderId(result.id); // armazena o id do pedido
        alert(`送信が完了しました！受付番号: ${result.id}`);
      }

    } catch (error) {
      alert("送信に失敗しました。");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className='reservation-main'>
      <div className="container">
        <h2>クリスマスケーキ予約フォーム</h2>
        <form className="form-order" onSubmit={handleSubmit}>

          <div className="cake-information">
            {cakes.map((item, index) => {
              // const selectedCake = cakeOptions.find(cake => cake.id_cake === Number(item.cake));
              const selectedCakeData = cakesData.cakes.find(
                c => String(c.id_cake) === item.cake
              );
              
              const sizeOptions: OptionType[] = 
                Array.isArray(selectedCakeData?.size)
                ? selectedCakeData.size.map(s => ({ value: s, label: s }))
                : [];
              
              return(
              <div className="box-cake" key={`${item.cake}-${index}`} >
                <button 
                  type="button" 
                  onClick={() => removeCake(index)} 
                  className='btn-remove-cake'
                  >
                    ❌
                  </button>

                {selectedCakeData && (
                  <img 
                    className='img-cake-order' 
                    src={selectedCakeData.image}
                    alt={selectedCakeData.name}
                  />
                )}

                <div className='input-group'>
                  <Select<OptionType>
                    options={cakeOptions}
                    value={cakeOptions.find(c => c.value === item.cake) || null}
                    onChange={selected =>  
                      updateCake(index, "cake", selected?.value || "0")
                    }
                    classNamePrefix="react-select"
                    placeholder="ケーキを選択"
                    // styles={customSyles}
                    required
                    styles={customStyles}
                  />
                  <label className='select-group'>*ケーキ名:</label>
                </div>

                {sizeOptions.length > 0 && (
                  <div className='input-group'>
                    <Select<OptionType>
                      options = {sizeOptions}
                      value={item.size
                        ? { value: item.size, label: item.size } : null
                      }
                      onChange={selected => 
                        updateCake(index, "size", selected?.value || "")
                      }
                      classNamePrefix='react-select'
                      placeholder='サイズを選択'
                      styles={customStyles}
                    />
                    <label className='select-group'>*ケーキのサイズ</label>
                  </div>
                )}
                
                <div className='input-group'>
                  <Select<OptionType>
                  options={quantityOptions}
                  value={quantityOptions.find(q => q.value === item.quantity || null)}
                  onChange={selected =>
                    updateCake(index, 'quantity', selected?.value || '1')
                  }
                  classNamePrefix='react-select'
                  placeholder='数量'
                  styles={customStyles}
                  />
                  <label className='select-group'>*個数:</label>
                </div>
                
                <div className='btn-div'>
                  <button type='button' onClick={addCake} className='btn btn-add-cake'>
                    ➕ 別のケーキを追加
                  </button>
                </div>
              </div>
            )}
          )}
          </div>

          <div className="client-information">
            <label htmlFor="full-name" className='title-information'>お客様情報</label>
            <div className="full-name">
              <div className='name-label input-group'>
                  <label htmlFor="name-label">*姓(カタカナ)</label>
                  <input type="text" name="first-name" id="first-name" placeholder="ヒガ" />
              </div>
              <div className='name-label input-group'>
                  <label htmlFor="first-name">*名(カタカナ)</label>
                  <input type="text" name="lastname" id="lastname" placeholder="タロウ" />
              </div>
              <div className='input-group'>
                <label htmlFor="email">*メールアドレス</label>
                <input type="email" name="email" id="email" placeholder='必須'/>
              </div>
              <div className='input-group'>
                <label htmlFor="tel">*お電話番号</label>
                {/* <input type="text" name="tel" id="tel" placeholder='ハイフン不要' /> */}
                <input type="tel" name="tel" id="tel" placeholder='ハイフン不要'/>
              </div>
            </div>

          </div>

          <div className="date-information">
            <label htmlFor="date" className='title-information'>*受取日 / その他</label>
            <h3 className='notification'>受取日は休業日を除いた３日以降より可能</h3>
            
            <div className='input-group'>
              <label htmlFor="datepicker" className='datepicker'>*受け取り希望日</label>
              <DatePicker
                selected={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                minDate={today}
                maxDate={addDays(today, 17)} 
                excludeDates={excludedDates}
                filterDate={isDateAllowed}
                dateFormat="yyyy年MM月dd日"
                placeholderText="日付を選択"
                className="react-datepicker"
                locale={ja}
                onFocus={handleFocus} 
                calendarClassName="datepicker-calendar"
                dayClassName={(date) => {
                  if (isSameDay(date, today)) return "hoje-azul";
                  if (getDay(date) === 0) return "domingo-vermelho";
                  return "";
                }}
                calendarContainer={MyContainer}
                
                renderDayContents={(day, date) => {
                  const isAvailable = isDateAllowed(date);
                  const isFuture = isAfter(date, today);
                  const isHoliday = excludedDates.some(d => isSameDay(d, date));

                  return (
                    <div className="day-cell">
                      <span>{day}</span>
                      {isAvailable && isFuture && <div className="selectable"></div>}
                      {isHoliday && <span className="yassumi">休</span>}
                    </div>
                  );
                }}
              />
            </div>
          
            <div className='input-group'>
              <Select 
                inputId="pickupHour"
                options={hoursOptions}
                value={hoursOptions.find(h => h.value === pickupHour)}
                onChange={(selected) => setPickupHour(selected?.value || "11~13時")}
                classNamePrefix="react-select"
                styles={customStyles}
              />
              <label htmlFor="pickupHour" className='select-group'>受け取り希望時間</label>
            </div>

            <div className='input-group'>
              <label htmlFor="message">その他</label>
              <textarea name="message" id="message" placeholder="メッセージプレートの内容など"></textarea>
            </div>
          </div>

          <div className='btn-div'>
            <button type='submit' className='send btn' disabled={isSubmitting}>
              {isSubmitting ? "送信中..." : "送信"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}