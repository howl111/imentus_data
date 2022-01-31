package stack
import(
	"fmt"
	"github.com/spf13/cobra"
)

var validateNoPosArgsFn = cobra.NoArgs

var stakeCmd = &cobra.Command{
	Use:   "staking",
	Short: "staking on validator",
	Args:  validateNoPosArgsFn,
	Run: func(cmd *cobra.Command, args []string) {
		// Return the help text
		cmd.HelpFunc()(cmd, args)
	},
}

func stake(){
	fmt.Println("hey i'm staking");
}

