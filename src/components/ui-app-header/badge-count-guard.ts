class BadgeCountGuard {
  public shows(count: number | null | undefined): count is number {
    return Number.isInteger(count) && Number(count) >= 1;
  }
}

const badgeCountGuard = new BadgeCountGuard();

export default badgeCountGuard;
