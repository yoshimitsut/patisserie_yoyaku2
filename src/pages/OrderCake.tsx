import { useState } from 'react';
import cakesData from '../data/cake.json';
import Select from 'react-select';
import DatePicker, { CalendarContainer } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ja } from 'date-fns/locale';
// import { data } from 'react-router-dom';
import { addDays, isAfter, isSameDay, getDay, format } from 'date-fns';
import type { StylesConfig, GroupBase } from 'react-select';

import type {OrderCake, OptionType, MyContainerProps, 
  // Cake
 } from "../types/types.ts"
import "./OrderCake.css";

const API_URL = import.meta.env.VITE_API_URL;


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
              <span>予約可能日  /  <span className='yassumi'>x</span> 予約不可</span>
          </div>
        </div>
      </div>
    );
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  // const cakeData: Cake[] = cakesData.cakes.map(c => ({
  //   id_cake: c.id_cake,
  //   name: c.name,
  //   sizes: c.sizes,
  //   stock: c.stock,
  //   image: c.image,
  // }))

  // opções de bolo
  const cakeOptions: OptionType[] = cakesData.cakes.map(c => ({
    value: String(c.id_cake),
    label: c.name,
    image: c.image
  }));

  // estado dos bolos escolhidos
  const [cakes, setCakes] = useState<OrderCake[]>([
    {id_cake: cakesData.cakes[0].id_cake, name: "", amount: 1, size: "", price: 1},
  ]);
  
  // opções de quantidade
  const quantityOptions: OptionType[] = Array.from({ length: 10 }, (_, i) => ({
    value: String(i + 1),
    label: String(i + 1),
  }));

  // adicionar bolos
  const addCake = () => {
    setCakes(prev => [...prev, {id_cake: 0, name: "", amount: 1, size: "", price: 1}]);
  };
  
  // remover bolos
  const removeCake = (index: number) => {
    setCakes(prev => prev.filter((_, i) => i !== index))
  };

  // atualizar campo de um bolo
  const updateCake = <K extends keyof OrderCake>(
    index: number,
    field: K,
    value: OrderCake[K]
  ) => {
    setCakes(prev =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  const [pickupHour, setPickupHour] = useState("時間を選択");

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
    control: (provided) => ({
      ...provided,
      boxShadow: 'none',
      border: '1px solid #000',
      borderRadius: '10px',
      paddingTop: '10px',
      paddingBottom: '10px',
    }),
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.blur(); // impede abrir teclado no celular
  };
  
  // envio do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const date_order = new Date();  
    const formattedDate = format(date_order, "yyyy-MM-dd");

    const data = {
      id_client: Math.random().toString(36).substring(2, 8),
      first_name: (document.getElementById("first-name") as HTMLInputElement).value,
      last_name: (document.getElementById("last-name") as HTMLInputElement).value,
      email: (document.getElementById("email") as HTMLInputElement).value,
      tel: (document.getElementById("tel") as HTMLInputElement).value,
      // date: (document.getElementById("date") as HTMLSelectElement).value,
      date: selectedDate?.toISOString().split('T')[0] || "",
      date_order: formattedDate,
      pickupHour,
      message: (document.getElementById("message") as HTMLTextAreaElement).value,
      cakes: cakes.map(c => {
        const cakeData = cakesData.cakes.find(cake => Number(cake.id_cake) === Number(c.id_cake));
        return {
          id_cake: cakeData?.id_cake,
          name: cakeData?.name,
          amount: c.amount,
          price: c.price,
          size: c.size,
          message_cake: c.message_cake || ""
        };
      })
    };
    
    try {
      const res = await fetch(`${API_URL}/api/reservar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      const result = await res.json();
      if (result.success) {
        // setOrderId(result.id); // armazena o id do pedido
        alert(`送信が完了しました！受付番号: ${String(result.id).padStart(4, "0")}`);
        
        // Limpar campos controlados
        setCakes([{ id_cake: cakesData.cakes[0].id_cake, name:"", amount: 1, size: "", price: 1, message_cake: "" }]);
        setSelectedDate(null);
        setPickupHour("時間を選択");

        // Limpar campos não controlados
        (document.getElementById("first-name") as HTMLInputElement).value = "";
        (document.getElementById("last-name") as HTMLInputElement).value = "";
        (document.getElementById("email") as HTMLInputElement).value = "";
        (document.getElementById("tel") as HTMLInputElement).value = "";
        (document.getElementById("message") as HTMLTextAreaElement).value = "";

      }

    } catch (error) {
      alert("送信に失敗しました。");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  const [, setText] = useState("");

  function toKatakana(str: string) {
    return str.replace(/[\u3041-\u3096]/g, (ch) =>
      String.fromCharCode(ch.charCodeAt(0) + 0x60)
    );
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
                c => c.id_cake === item.id_cake
              );
              
              const sizeOptions: OptionType[] = 
                Array.isArray(selectedCakeData?.sizes)
                ? selectedCakeData.sizes.map(s => ({ 
                    value: JSON.stringify({ size: s.size, price: s.price }), 
                    label: `${s.size} ￥${s.price.toLocaleString()}` }))
                : [];
              
              return(
              <div className="box-cake" key={`${item.id_cake}-${index}`} >
                {index > 0 && (
                <div className='btn-remove-div'>
                <button 
                  type="button" 
                  onClick={() => removeCake(index)} 
                  className='btn-remove-cake'
                  >
                    ❌
                  </button>
                </div>
                )}
                {selectedCakeData && (
                  <img 
                    className='img-cake-order' 
                    src={selectedCakeData.image}
                    alt={selectedCakeData.name}
                  />
                )}
                {/* {cakeData.map(cake => (
                  <div key={cake.id_cake}>
                    <h3>{cake.name}</h3>
                    <img src="{cake.image}" alt="{cake.name}" />
                    <ul>
                      {cake.sizes.map((s, i) => (
                        <li key={i}>{s.size}</li>
                      ))}
                    </ul>
                  </div>
                ))} */}

                <div className='input-group'>
                  <Select<OptionType>
                    options={cakeOptions}
                    value={cakeOptions.find(c => Number(c.value) === item.id_cake) || null}
                    onChange={selected =>  
                      updateCake(index, "id_cake", selected ? Number(selected.value) : 0)
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
                        ? { 
                          value: JSON.stringify({ size: item.size, price: item.price }), 
                          label: `${item.size} ￥${item.price}` } : null
                        }
                        onChange={selected => {
                          if (selected) {
                            const parsed = JSON.parse(selected.value);
                            setCakes(prev =>
                              prev.map((c, i) =>
                                i === index ? { ...c, size: parsed.size, price: parsed.price } : c
                              )
                            );
                          }
                        } 
                      }
                      classNamePrefix='react-select'
                      placeholder='サイズを選択'
                      styles={customStyles}
                      required
                    />
                    <label className='select-group'>*ケーキのサイズ</label>
                  </div>
                )}
                
                <div className='input-group'>
                  <Select<OptionType>
                  options={quantityOptions}
                  value={quantityOptions.find(q => q.value === String(item.amount) || null)}
                  onChange={selected =>
                    updateCake(index, 'amount', selected? Number(selected.value) : 1)
                  }
                  classNamePrefix='react-select'
                  placeholder='数量'
                  styles={customStyles}
                  required
                  />
                  <label className='select-group'>*個数:</label>
                </div>

                <div className='input-group'>
                  <label htmlFor="message_cake">メッセージプレート</label>
                  <textarea name="message_cake" id="message_cake" placeholder="ご要望がある場合のみご記入ください。"
                    value={item.message_cake || ""}
                    onChange={(e) => updateCake(index, "message_cake", e.target.value)}
                  ></textarea>
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
                  <input type="text" name="first-name" id="first-name" placeholder="ヒガ" 
                  lang='ja' autoCapitalize='none' autoCorrect='off' onChange={(e) => setText(toKatakana(e.target.value))}
                  required/>
              </div>
              <div className='name-label input-group'>
                  <label htmlFor="first-name">*名(カタカナ)</label>
                  <input type="text" name="last-name" id="last-name" placeholder="タロウ" required/>
              </div>
              <div className='input-group'>
                <label htmlFor="email">*メールアドレス</label>
                <input type="email" name="email" id="email" placeholder='必須' required/>
              </div>
              <div className='input-group'>
                <label htmlFor="tel">*お電話番号</label>
                {/* <input type="text" name="tel" id="tel" placeholder='ハイフン不要' /> */}
                <input type="tel" name="tel" id="tel" placeholder='ハイフン不要' required/>
              </div>
            </div>

          </div>

          <div className="date-information">
            <label htmlFor="date" className='title-information'>*受取日 / その他</label>
            <span className='notification'>受取日は休業日を除いた３日以降より可能</span>
            
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
                required
                dayClassName={(date) => {
                  if (isSameDay(date, today)) return "hoje-azul";
                  if (getDay(date) === 0) return "domingo-vermelho";
                  if (getDay(date) === 6) return "sabado-azul";
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
                      {isHoliday && <span className="yassumi">x</span>}
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
                onChange={(selected) => setPickupHour(selected?.value || "時間を選択")}
                classNamePrefix="react-select"
                styles={customStyles}
                placeholder="時間を選択"
                required
              />
              <label htmlFor="pickupHour" className='select-group'>受け取り希望時間</label>
            </div>

            <div className='input-group'>
              <label htmlFor="message">その他</label>
              <textarea name="message" id="message" placeholder=""></textarea>
            </div>
          </div>

          <div className='btn-div'>
            <button type='submit' className='send btn' 
            disabled={isSubmitting}
            >
              {isSubmitting ? "送信中..." : "送信"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}