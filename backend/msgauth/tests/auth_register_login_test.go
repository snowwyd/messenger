package tests

import (
	"math/rand"
	"msgauth/tests/suite"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	msgv1 "github.com/snowwyd/protos/gen/go/msgauth"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

const (
	emptyAppID = 0
	appID      = "67ba002d979a4dbd25ebefd7"
	appSecret  = "sanyakrut"
	passLen    = 10
	adminEmail = "snowwyd@gmail.com"
)

func TestRegisterLogin_Login_HappyPath(t *testing.T) {
	ctx, st := suite.New(t)

	email := genEmail(adminEmail)
	pass := "asbasda"

	respReg, err := st.AuthClient.Register(ctx, &msgv1.RegisterRequest{
		Email:    email,
		Password: pass,
	})
	require.NoError(t, err)
	assert.NotEmpty(t, respReg.GetUserId())

	respLogin, err := st.AuthClient.Login(ctx, &msgv1.LoginRequest{
		Email:    email,
		Password: pass,
		AppId:    appID,
	})
	require.NoError(t, err)

	loginTime := time.Now()
	token := respLogin.GetToken()

	require.NotEmpty(t, token)

	tokenParsed, err := jwt.Parse(token, func(token *jwt.Token) (interface{}, error) {
		return []byte(appSecret), nil
	})
	require.NoError(t, err)

	claims, ok := tokenParsed.Claims.(jwt.MapClaims)
	assert.True(t, ok)

	assert.Equal(t, respReg.GetUserId(), claims["uid"].(string))
	assert.Equal(t, email, claims["email"].(string))
	assert.Equal(t, appID, claims["app_id"].(string))

	const deltaSeconds = 1
	assert.InDelta(t, loginTime.Add(st.Cfg.TokenTTL).Unix(), claims["exp"].(float64), deltaSeconds)
}

func TestRegisterIsAdmin(t *testing.T) {
	ctx, st := suite.New(t)

	email := adminEmail
	pass := "asbasda"
	isAdmin := true

	respReg, err := st.AuthClient.Register(ctx, &msgv1.RegisterRequest{
		Email:    email,
		Password: pass,
	})
	require.NoError(t, err)
	assert.NotEmpty(t, respReg.GetUserId())

	respIsAdmin, err := st.AuthClient.IsAdmin(ctx, &msgv1.IsAdminRequest{
		UserId: respReg.GetUserId(),
	})
	require.NoError(t, err)
	assert.NotEmpty(t, respIsAdmin.IsAdmin)

	assert.Equal(t, respIsAdmin.IsAdmin, isAdmin)

	email = genEmail(adminEmail)
	pass = "asbasda"
	isAdmin = false

	respReg, err = st.AuthClient.Register(ctx, &msgv1.RegisterRequest{
		Email:    email,
		Password: pass,
	})
	require.NoError(t, err)
	assert.NotEmpty(t, respReg.GetUserId())

	respIsAdmin, err = st.AuthClient.IsAdmin(ctx, &msgv1.IsAdminRequest{
		UserId: respReg.GetUserId(),
	})
	require.NoError(t, err)
	assert.NotNil(t, respIsAdmin.IsAdmin)

	assert.Equal(t, respIsAdmin.IsAdmin, isAdmin)

}

func TestLogin_FailCases(t *testing.T) {
	ctx, st := suite.New(t)

	tests := []struct {
		name        string
		email       string
		password    string
		appID       string
		expectedErr string
	}{
		{
			name:        "Login with Empty Password",
			email:       genEmail(adminEmail),
			password:    "",
			appID:       appID,
			expectedErr: "password is required",
		},
		{
			name:        "Login with Empty Email",
			email:       "",
			password:    genPassword(passLen),
			appID:       appID,
			expectedErr: "email is required",
		},
		{
			name:        "Login with Both Empty Email and Password",
			email:       "",
			password:    "",
			appID:       appID,
			expectedErr: "email is required",
		},
		{
			name:        "Login with Non-Matching Password",
			email:       genEmail(adminEmail),
			password:    genPassword(passLen),
			appID:       appID,
			expectedErr: "invalid credentials",
		},
		{
			name:        "Login without AppID",
			email:       genEmail(adminEmail),
			password:    genPassword(passLen),
			appID:       "",
			expectedErr: "app_id is required",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := st.AuthClient.Register(ctx, &msgv1.RegisterRequest{
				Email:    genEmail(adminEmail),
				Password: genPassword(passLen),
			})
			require.NoError(t, err)

			_, err = st.AuthClient.Login(ctx, &msgv1.LoginRequest{
				Email:    tt.email,
				Password: tt.password,
				AppId:    tt.appID,
			})
			require.Error(t, err)
			require.Contains(t, err.Error(), tt.expectedErr)
		})
	}
}

// Функция генерирует строку из трех случайных букв от 'a' до 'z'

func randomLetters(n int) string {
	letters := []rune("abcdefghijklmnopqrstuvwxyz")
	var result []rune

	for i := 0; i < n; i++ {
		result = append(result, letters[rand.Intn(len(letters))])
	}

	return string(result)
}

func genEmail(input string) string {
	prefix := randomLetters(3)
	return prefix + input
}

func genPassword(len int) string {
	return randomLetters(len)
}

func init() {
	rand.Seed(time.Now().UnixNano())
}
