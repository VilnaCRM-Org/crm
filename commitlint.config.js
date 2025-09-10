module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'check-task-number-rule': [2, 'always'],
  },
  listOfNames: [
    'build',
    'chore',
    'ci',
    'docs',
    'feat',
    'fix',
    'perf',
    'refactor',
    'revert',
    'style',
    'test',
  ],
  plugins: [
    {
      rules: {
        'check-task-number-rule': (data) => {
          const list = module.exports.listOfNames.join('|');

          const regexp = new RegExp(`^(${list})\\(#(\\d+)\\):`, 'gm');

          const taskNumber = data.header.match(regexp);

          const correctCommit = taskNumber !== null;

          return [
            correctCommit,
            'Your commit message should follow <type>(#<task>): e.g. feat(#123): add registration form',
          ];
        },
      },
    },
  ],
};
