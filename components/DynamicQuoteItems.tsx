"use client";

import * as React from "react";

type QuoteOption = {
  id: string;
  label: string;
};

type DynamicRowsProps = {
  title: string;
  selectLabel: string;
  selectName: string;
  quantityName: string;
  options: QuoteOption[];
};

function DynamicRows({ title, selectLabel, selectName, quantityName, options }: DynamicRowsProps) {
  const nextId = React.useRef(1);
  const [rows, setRows] = React.useState([{ id: 0, value: "" }]);

  function updateRow(index: number, value: string) {
    setRows((currentRows) => {
      const nextRows = currentRows.map((row, rowIndex) => (rowIndex === index ? { ...row, value } : row));
      if (value && index === currentRows.length - 1) {
        nextRows.push({ id: nextId.current, value: "" });
        nextId.current += 1;
      }
      return nextRows;
    });
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-black">{title}</p>
      {rows.map((row, index) => (
        <div key={row.id} className="grid grid-cols-[1fr_74px] gap-2">
          <select
            name={selectName}
            aria-label={`${selectLabel} ${index + 1}`}
            value={row.value}
            onChange={(event) => updateRow(index, event.target.value)}
            className="h-11 rounded-lg px-3"
          >
            <option value="">{selectLabel}</option>
            {options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <input name={quantityName} type="number" min={1} defaultValue={1} className="h-11 rounded-lg px-3" />
        </div>
      ))}
    </div>
  );
}

export function DynamicQuoteItems({ products, services }: { products: QuoteOption[]; services: QuoteOption[] }) {
  return (
    <>
      <DynamicRows title="Produtos" selectLabel="Produto" selectName="productId" quantityName="productQuantity" options={products} />
      <DynamicRows title="Servicos" selectLabel="Servico" selectName="serviceId" quantityName="serviceQuantity" options={services} />
    </>
  );
}
