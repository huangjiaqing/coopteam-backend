import mongoose from 'mongoose';
import R from 'ramda';
const Stage = mongoose.model('Stage');

export default {
  /**
   * 获取某个项目下的所有阶段
   * @param {string} _projectId 
   */
  async getStages(_projectId) {
    return (
      this.sortStages(await Stage.find({ _projectId }))
    );
  },
  
  /**
   * 创建阶段
   * @param {object} data 
   */
  async createStage(data) {
    const { order=null } = data;
    let stages = await Stage.find({
       _projectId: data._projectId
    });
    stages = this.sortStages(stages);
    let stage = {
      ...data,
      _stageId: mongoose.Types.ObjectId()
    };
    if (!order) {
      let stageCount = stages.length;
      stage.order = stageCount+1;
      return await new Stage(stage).save();
    }
    if (order && R.is(Number, order)) {
      stages.forEach(async (item) => {
        if (R.gte(item.order, order)) {
          let newOrder = item.order+1;
          await Stage.findOneAndUpdate({
            _stageId: item._stageId
          }, {
            order: newOrder
          });
        }
        return await new Stage(stage).save();
      });
    } else {
      return {
        msg: '创建阶段失败'
      }
    }
  },

  /**
   * 排序数据库中的阶段
   * @param {Array} stages
   */
  sortStageForDB: async (stages=[]) => {
    for (let i=0; i<stages.length; i++) {
      await Stage.findOneAndUpdate({
        _stageId: stages[i]._stageId
      }, { order: i + 1 });
    }
  },

  /**
   * 对阶段数组进行排序
   * @param {Array} stages
   */
  sortStages: (stages=[]) => (
    R.compose(
      R.addIndex(R.map)(
        (stage, idx) => {
          stage.order = idx + 1;
          return stage
        }
      ),
      R.sort((a, b)=>(a.order-b.order))
    )(stages)
  ),

  /**
   * 移动阶段
   * @param {object} data 
   */
  async moveStage(data) {
    const { order, _projectId, _stageId } = data;
    const stages = await Stage.find({ _projectId });
    R.compose(
      // 编号
      (stages) => this.sortStageForDB(stages),
      // 重组
      (stages) => {
        let isSame = (stage) => (
          R.equals(stage._stageId.toString(), _stageId)
        );
        let others = R.reject(isSame)(stages);
        let seleted = R.filter(isSame)(stages).pop();
        let _stages = R.insert(order-1, seleted)(others);
        return _stages;
      },
      // 排序
      (stages) => this.sortStages(stages)
    )(stages);
  },

  /**
   * 删除阶段
   * @param {string} _stageId 
   */
  async removeStage(_stageId) {
    await Stage.findOneAndRemove({_stageId});
    return { msg: "操作成功" };
  }
};