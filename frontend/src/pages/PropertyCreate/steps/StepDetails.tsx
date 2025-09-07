import React from "react";
import s from "../Wizard.module.css";
import type { ListingDraft } from "../Wizard";

type Props = {
  value: ListingDraft;
  onChange: (next: Partial<ListingDraft>) => void;
};

export default function StepDetails({ value, onChange }: Props) {
  const showFurniture = value.condition !== "new_psd";

  return (
    <div className={s.form}>
      {/* 1 ряд: Комнаты / Этаж */}
      <div className={s.formItem}>
          <div className={s.formItem}>
            <label className={s.labelRow}>Комнаты</label>
            <div className={s.pills}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`${s.pill} ${value.rooms === n ? s.pillActive : ""}`}
                  onClick={() => onChange({ rooms: n })}
                  style={{ width: "14%" }}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                className={`${s.pill} ${
                  value.rooms && value.rooms > 5 ? s.pillActive : ""
                }`}
                onClick={() => onChange({ rooms: (value.rooms ?? 0) + 5 })}
                style={{ width: "14%" }}
              >
                +5
              </button>
            </div>
          </div>

        </div>


        <div className={s.formItem}>
          <label className={s.labelRow}>Этаж</label>
          <input
            className={s.input}
            type="number"
            min={0}
            value={value.floor ?? ""}
            onChange={(e) =>
              onChange({ floor: e.target.value ? Number(e.target.value) : null })
            }
          />
        </div>


        {/* 2 ряд: Площадь / Состояние */}
        <div className={s.twoCols}>
          <div className={s.formItem}>
            <label className={s.labelRow}>Площадь (м²)</label>
            <input
              className={s.input}
              type="number"
              min={0}
              step={0.1}
              value={value.area ?? ""}
              onChange={(e) =>
                onChange({ area: e.target.value ? Number(e.target.value) : undefined })
              }
            />
          </div>

          <div className={s.formItem}>
            <label className={s.labelRow}>Состояние</label>
            <select
              className={s.select}
              value={value.condition ?? ""}
              onChange={(e) =>
                onChange({ condition: e.target.value as ListingDraft["condition"] })
              }
            >
              <option value="" disabled>
                Выберите...
              </option>
              <option value="new_psd">Сдан ПСО</option>
              <option value="requires_repair">Требуется ремонт</option>
              <option value="cosmetic">Косметический</option>
              <option value="euro">Евроремонт</option>
            </select>
          </div>
        </div>

      {/* Чекбокс мебель */}
      {showFurniture && (
        <label className={s.checkLine}>
          <span>Есть мебель</span>
          <input
            type="checkbox"
            checked={!!value.furniture}
            onChange={(e) => onChange({ furniture: e.target.checked })}
            style={{ cursor: "pointer" }}
          />
        </label>
      )}

      {/* 3 ряд: Тип предложения / Статус */}
      <div className={s.twoCols}>
        <div className={s.formItem}>
          <label className={s.labelRow}>Тип предложения</label>
          <select
            className={s.select}
            value={value.offer_type ?? ""}
            onChange={(e) =>
              onChange({ offer_type: e.target.value as ListingDraft["offer_type"] })
            }
          >
            <option value="" disabled>
              Выберите...
            </option>
            <option value="owner">Собственник (Хозяин)</option>
            <option value="intermediary">Посредник (Родственник, СК, Знакомый)</option>
            <option value="contractor">Подрядчик (Бартерщик)</option>
            <option value="realtor">Риелтор (Агентство)</option>
          </select>
        </div>

        <div className={s.formItem}>
          <label className={s.labelRow}>Статус объекта</label>
          <select
            className={s.select}
            value={value.status ?? "active"}
            onChange={(e) =>
              onChange({ status: e.target.value as ListingDraft["status"] })
            }
          >
            <option value="active">В продаже / Активен</option>
            <option value="draft">Черновик</option>
            <option value="reserved">Зарезервирован</option>
            <option value="sold">Продан</option>
            <option value="archived">Архив</option>
          </select>
        </div>
      </div>
    </div>
  );
}
