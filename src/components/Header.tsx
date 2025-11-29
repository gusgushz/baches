import React from 'react'
import '../styles/header.css'

type HeaderProps = {
  title?: string
  leftSlot?: React.ReactNode
  centerSlot?: React.ReactNode
  rightSlot?: React.ReactNode
  centered?: boolean
}

export default function Header({ leftSlot, centerSlot, rightSlot, centered }: HeaderProps) {
  const cls = centered ? 'app-header app-header--centered' : 'app-header'
  return (
    <header className={cls}>
      <div className="app-header__left">{leftSlot}</div>
      <div className="app-header__center">{centerSlot}</div>
      <div className="app-header__right">{rightSlot}</div>
    </header>
  )
}