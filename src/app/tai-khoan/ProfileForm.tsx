"use client";

import { useActionState } from "react";
import { updateProfile } from "./actions";

export function ProfileForm({ name, phone, address }: { name: string; phone: string; address: string }) {
  const [state, action, pending] = useActionState(updateProfile, {});
  return (
    <form action={action} className="card space-y-4">
      <div>
        <label className="label" htmlFor="name">Họ tên</label>
        <input id="name" name="name" defaultValue={name} required className="input" autoComplete="name" />
      </div>
      <div>
        <label className="label" htmlFor="phone">Số điện thoại</label>
        <input id="phone" name="phone" defaultValue={phone} className="input" inputMode="tel" autoComplete="tel" />
      </div>
      <div>
        <label className="label" htmlFor="address">Địa chỉ giao hàng mặc định</label>
        <input id="address" name="address" defaultValue={address} className="input" autoComplete="street-address" placeholder="Số nhà, đường, phường, TP Thái Nguyên" />
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.ok && <p className="text-sm text-emerald-700">Đã lưu thông tin</p>}
      <button className="btn-primary" disabled={pending}>{pending ? "Đang lưu..." : "Lưu thông tin"}</button>
    </form>
  );
}
