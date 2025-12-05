import React from 'react'
import { useSidebar } from '../contexts/SidebarContext'
import '../styles/header.css'

type HeaderProps = {
  title?: string
  leftSlot?: React.ReactNode
  centerSlot?: React.ReactNode
  rightSlot?: React.ReactNode
  centered?: boolean
}

const IconChevron = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export default function Header({ leftSlot, centerSlot, rightSlot, centered }: HeaderProps) {
  const cls = centered ? 'app-header app-header--centered' : 'app-header'
  return (
    <header className={cls}>
      <div className="app-header__left">
        {leftSlot}
      </div>
      <div className="app-header__center">{centerSlot}</div>
      <div className="app-header__right">{rightSlot}</div>
    </header>
  )
}