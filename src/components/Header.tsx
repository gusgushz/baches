import React from 'react'
import '../styles/header.css'

type HeaderProps = {
  title?: string
  leftSlot?: React.ReactNode
  centerSlot?: React.ReactNode
  rightSlot?: React.ReactNode
}

export default function Header({leftSlot, centerSlot, rightSlot }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="app-header__left">{leftSlot}</div>
      <div className="app-header__center">{centerSlot}</div>
      <div className="app-header__right">{rightSlot}</div>
    </header>
  )
}