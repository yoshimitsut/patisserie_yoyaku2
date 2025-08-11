import { useState } from 'react';
import cakesData from '../data/cake.json';
import Select from 'react-select';
import "./OrderCake.css";

type CakeOrder = {
  cake: string;
  quantity: string;
  size: string;
}

type OptionType = {
  value: string;
  label: string;
};


function OrderCake() {
  const cakeOptions: OptionType[] = cakesData.cakes.map(c => ({
    value: String(c.id_cake),
    label: c.name
  }));

  const [cakes, setCakes] = useState<CakeOrder[]>([
    {cake: String(cakesData.cakes[0].id_cake), quantity: "1", size: ""},
  ])
  
  const removeCake = (index: number) => {
    setCakes(prev => prev.filter((_, i) => i !== index))
  }

  const updateCake = (index: number, field: keyof CakeOrder, value: string) => {
    setCakes(prev => 
      prev.map((item, i) => (i === index ? {...item, [field]: value } : item))
    );
  };

  return (
    <div className='reservation-main'>
      <div className="container">
        <h2>クリスマスケーキ予約フォーム</h2>
        <form className="form-order">
          <div className="cake-information">
            {cakes.map((item, index) => {
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
                    />
                    <label className='select-group'>*ケーキのサイズ</label>
                  </div>
                )}

              
              </div>
            )}
            )}

          </div>

          <div className="client-information">

          </div>
          <div className="date-information">

          </div>
        </form>
      </div>
    </div>
  );
}

export default OrderCake;