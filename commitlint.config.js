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

          const regexp = new RegExp(`^(${list})(\\([\\w-]+\\))?(!)?\\(#(\\d+)\\):`, 'm');

          const taskNumber = data.header.match(regexp);

          const correctCommit = taskNumber !== null;

          return [correctCommit, `your task number is incorrect (e.g., feat(#1): message)`];
        },
      },
    },
  ],
};
