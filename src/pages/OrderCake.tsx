import { useState, useEffect } from 'react';
import Select, { components, type OptionProps, type StylesConfig, type GroupBase } from 'react-select';
import DatePicker, { CalendarContainer } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ja } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { addDays, isAfter, isSameDay, format } from 'date-fns';

import type { OrderCake, OptionType, MyContainerProps, CakeJson } from "../types/types.ts";
import "./OrderCake.css";

const API_URL = import.meta.env.VITE_API_URL;

type CustomOptionType = OptionType & {
  isDisabled?: boolean;
};

// const CustomOption = (props: OptionProps<CustomOptionType>) => {
//   const { innerProps, label, isDisabled, isSelected } = props;
//   const shouldShowDisabledStyle = isDisabled && !isSelected;

//   return shouldShowDisabledStyle ? (
//     <div {...innerProps} style={{ color: '#888', textDecoration: 'line-through', padding: 10, cursor: 'not-allowed' }}>
//       {label}
//     </div>
//   ) : (
//     <components.Option {...props} />
//   );
// };

export default function OrderCake() {
  const navigate = useNavigate();

  const [cakesData, setCakesData] = useState<CakeJson | null>(null);
  const [cakes, setCakes] = useState<OrderCake[]>([
    { id_cake: 0, name: "", amount: 1, size: "", price: 1, message_cake: "" }
  ]);
  
  // Efeito para carregar os dados dos bolos apenas uma vez
  useEffect(() => {
    fetch(`${API_URL}/api/cake`)
      .then(res => res.json())
      .then(data => {
        setCakesData(data);
      })
      .catch(error => {
        console.error("Erro ao carregar dados dos bolos:", error);
      });
  }, []);

  const MyContainer = ({ className, children }: MyContainerProps) => {
    return (
      <div>
        <CalendarContainer className={className}>{children}</CalendarContainer>
        <div className='calendar-notice'>
          {/* <div style={{ padding: "20px" }}>
              <p>３日前よりご予約可能（２週間後まで）</p>
            </div> */}
          <div className='notice'>                                                                                            
            <div className='selectable'></div>
              <span>予約可能日  /  <span className='yassumi'>x</span> 予約不可</span>
          </div>
        </div>
      </div>
    );
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const getOrderedAmount = (cakeId: number) => {
    return cakes.reduce((total, c) => (c.id_cake === cakeId ? total + c.amount : total), 0)
  };

  const cakeOptions: CustomOptionType[] = cakesData?.cakes.map(c => {
    const orderedAmount = getOrderedAmount(c.id_cake);
    const isSoldOut = c.stock <= 0 || (orderedAmount > 0 && orderedAmount >= c.stock);
    return {
      value: String(c.id_cake),
      label: c.name,
      image: c.image,
      isDisabled: isSoldOut,
    };
  }) || [];

  // Calcula quanto já foi usado de um bolo, excluindo a instância atual
  const getUsedStock = (cakeId: number, excludeIndex?: number) => {
    return cakes.reduce((acc, c, idx) => {
      // Verifica se o bolo é o mesmo e não é o item atual da lista
      if (idx !== excludeIndex && c.id_cake === cakeId) {
        return acc + c.amount;
      }
      return acc;
    }, 0);
  }

  // Gera opções de quantidade de acordo com o estoque restante
  const getQuantityOptions = (cake: { id_cake: number; stock: number} | undefined, index: number): OptionType[] => {
    if (!cake) return [];

    const used = getUsedStock(cake.id_cake, index);
    const remaining = Math.max(0, cake.stock - used);
    
    // Limita o máximo de opções ao estoque restante ou 10
    const limit = Math.min(10, remaining); 
    
    return Array.from({ length: limit }, (_, i) => ({
      value: String(i + 1),
      label: String(i + 1),
    }));
  };

  const addCake = () => {
    setCakes(prev => [
      ...prev,
      {
        id_cake: 0, 
        name: "",
        amount: 1,
        size: "",
        price: 1,
        message_cake: ""
      }
    ]);
  };

  const removeCake = (index: number) => {
    setCakes(prev => prev.filter((_, i) => i !== index));
  };

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

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
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
    { day: 12, month: 7 },
    { day: 15, month: 7 },
    { day: 20, month: 7 },
    { day: 21, month: 7 },
    { day: 20, month: 8 },
    { day: 21, month: 8 },
  ];

  const allowedDates = [
    new Date(today.getFullYear(), 11, 22),
    new Date(today.getFullYear(), 11, 23),
    new Date(today.getFullYear(), 11, 24),
    new Date(today.getFullYear(), 11, 25),
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
  };
  
  const excludedDates = [
    ...generateBlockedDaysStart(),
    ...generateSpecificDatesWithMonth(),
  ];

  const isDateAllowed = (date: Date) => !excludedDates.some((d) => isSameDay(d, date));
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
    option: (provided, state) => ({
      ...provided,
      color: state.isDisabled ? '#888' : 'black',
      textDecoration: state.isDisabled ? 'line-through' : 'none',
    }),
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.blur(); 
  };
  
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
      date: selectedDate?.toISOString().split('T')[0] || "",
      date_order: formattedDate,
      pickupHour,
      message: (document.getElementById("message") as HTMLTextAreaElement).value,
      cakes: cakes.map(c => {
        const cakeData = cakesData?.cakes.find(cake => Number(cake.id_cake) === Number(c.id_cake));
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
        navigate("check");
        if (cakesData && cakesData.cakes.length > 0) {
          const initialCake = cakesData.cakes[0];
          setCakes([{
            id_cake: initialCake.id_cake,
            name: initialCake.name,
            amount: 1,
            size: "",
            price: 1,
            message_cake: ""
          }]);
        }
        setSelectedDate(null);
        setPickupHour("時間を選択");
        (document.getElementById("first-name") as HTMLInputElement).value = "";
        (document.getElementById("last-name") as HTMLInputElement).value = "";
        (document.getElementById("email") as HTMLInputElement).value = "";
        (document.getElementById("tel") as HTMLInputElement).value = "";
        (document.getElementById("message") as HTMLTextAreaElement).value = "";
      } else {
        alert(result.error);
      }
    } catch (error) {
      alert("送信に失敗しました。");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const [, setText] = useState("");
  function toKatakana(str: string) {
    return str.replace(/[\u3041-\u3096]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) + 0x60));
  }
  
  return (
    <div className='reservation-main'>
      <div className="container">
        <h2>クリスマスケーキ予約フォーム</h2>
        <form className="form-order" onSubmit={handleSubmit}>
          <div className="cake-information">
            {cakes.map((item, index) => {
              const selectedCakeData = cakesData?.cakes.find(
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
                  <div className='input-group'>
                      <Select<CustomOptionType>
                          options={cakeOptions}
                          value={cakeOptions.find(c => Number(c.value) === item.id_cake) || null}
                          onChange={selected =>  
                              updateCake(index, "id_cake", selected ? Number(selected.value) : 0)
                          }
                          classNamePrefix="react-select"
                          placeholder="ケーキを選択"
                          required
                          styles={customStyles}
                          // components={{ Option: CustomOption }}
                          formatOptionLabel={(option, { context }) => {
                            const isSelected = Number(option.value) === item.id_cake;
                            if (context === 'menu' && option.isDisabled && !isSelected) {
                              return <div style={{ color: '#888' }}>{option.label} （完売）</div>;
                          }
                          return option.label;
                        }}
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
                      options={getQuantityOptions(selectedCakeData, index)}
                      value={getQuantityOptions(selectedCakeData, index).find(
                        q => q.value === String(item.amount)
                      ) || null}
                      onChange={selected =>
                        updateCake(index, "amount", selected ? Number(selected.value) : 0)
                      }
                      classNamePrefix="react-select"
                      placeholder="数量"
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
                onChange={handleDateChange}
                includeDates={allowedDates}
                filterDate={isDateAllowed}
                minDate={allowedDates[0]}
                maxDate={allowedDates[allowedDates.length - 1]}
                openToDate={allowedDates[0]}
                dateFormat="yyyy年MM月dd日"
                placeholderText="日付を選択"
                className="react-datepicker"
                locale={ja}
                calendarClassName="datepicker-calendar"
                calendarContainer={MyContainer}
                onFocus={handleFocus}
                required
                renderDayContents={(day, date) => {
                  const isAvailable = allowedDates.some(d => isSameDay(d, date));
                  const isFuture = isAfter(date, today);
                  const isHoliday = !isAvailable;
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
              <Select<OptionType>
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