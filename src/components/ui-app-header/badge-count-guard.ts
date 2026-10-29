class BadgeCountGuard {
  public shows(count: number | null | undefined): boolean {
    return Number.isInteger(count) && Number(count) >= 1;
  }
}

const badgeCountGuard = new BadgeCountGuard();

export default badgeCountGuard;
